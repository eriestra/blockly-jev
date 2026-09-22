#!/usr/bin/env python3
"""Align the exact English scripts to the delivered MP3s using acoustic CTC alignment.

Install requirements-align.txt into an isolated Python 3.12 environment, then run:
  python demo/explainers/align.py [lesson ...]

The delivered MP3 is the timing authority: no speech rewriting, tempo change,
word-share interpolation, or sentence assignment to a guessed pause. All words
must align in order. Inspect low-confidence words and independent sentence crops
before publishing. Model scores are diagnostics, not a perceptual quality claim.

Audio mastering, when changing a source take, remains a separate explicit step:
ffmpeg -i voice/LESSON.mp3 -af 'adelay=400|400,apad=pad_dur=1.2,loudnorm=I=-16:TP=-1.5:LRA=9,aformat=sample_rates=44100:channel_layouts=stereo' -c:a libmp3lame -b:a 128k ../public/media/LESSON.mp3
Re-run alignment after any delivered audio change.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

import numpy as np
import torch
import torchaudio

HERE = Path(__file__).resolve().parent
MEDIA = HERE.parent / 'public' / 'media'
MODEL = 'WAV2VEC2_ASR_BASE_960H'
SAMPLE_RATE = 16000


def align(model, vocabulary, text, path):
    raw = subprocess.check_output([
        'ffmpeg', '-nostdin', '-loglevel', 'error', '-i', str(path),
        '-ar', str(SAMPLE_RATE), '-ac', '1', '-f', 'f32le', '-',
    ])
    waveform = torch.from_numpy(np.frombuffer(raw, dtype=np.float32).copy()).unsqueeze(0)
    with torch.inference_mode():
        emission = model(waveform)[0].log_softmax(-1)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    words = [word for sentence in sentences for word in sentence.split()]
    normalized = [re.sub("[^A-Z']", '', word.upper()) for word in words]
    if not all(normalized):
        raise ValueError('Spell numbers out in the narration script')
    transcript = '|'.join(normalized)
    target = torch.tensor([[vocabulary[c] for c in transcript]], dtype=torch.int32)
    aligned, scores = torchaudio.functional.forced_align(emission, target, blank=0)
    spans = torchaudio.functional.merge_tokens(aligned[0], scores[0].exp())
    if len(spans) != len(transcript):
        raise ValueError('Alignment did not cover the complete script')
    duration = waveform.shape[1] / SAMPLE_RATE
    seconds_per_frame = duration / emission.shape[1]
    timings, cursor = [], 0
    for word, clean in zip(words, normalized):
        parts = spans[cursor:cursor + len(clean)]
        assert [p.token for p in parts] == [vocabulary[c] for c in clean]
        timings.append({
            'text': word,
            'start': round(parts[0].start * seconds_per_frame, 3),
            'end': round(parts[-1].end * seconds_per_frame, 3),
            'score': round(sum(p.score for p in parts) / len(parts), 3),
        })
        cursor += len(clean) + 1
    suspect = [w for w in timings if w['score'] < .25 or w['end'] - w['start'] > 2]
    if suspect:
        raise ValueError(f'Review uncertain words before publishing: {suspect}')
    cues, cursor = [], 0
    for i, sentence in enumerate(sentences):
        chunk = timings[cursor:cursor + len(sentence.split())]
        cursor += len(chunk)
        cues.append({
            'i': i, 'text': sentence, 'start': chunk[0]['start'], 'end': chunk[-1]['end'],
            'words': [[w['text'], w['start']] for w in chunk],
            'wordEnds': [w['end'] for w in chunk],
        })
    return {
        'total': round(duration, 3), 'cues': cues,
        'alignment': {'method': 'CTC forced alignment', 'model': MODEL,
                      'audioSha256': hashlib.sha256(path.read_bytes()).hexdigest()},
    }, timings


def main():
    scripts = json.loads((HERE / 'scripts.json').read_text())
    ids = sys.argv[1:] or list(scripts)
    tracks = json.loads((HERE / 'cues.json').read_text())
    report = {}
    torch.set_num_threads(4)
    bundle = getattr(torchaudio.pipelines, MODEL)
    model = bundle.get_model().eval()
    vocabulary = {c: i for i, c in enumerate(bundle.get_labels())}
    for name in ids:
        track, words = align(model, vocabulary, scripts[name], MEDIA / f'{name}.mp3')
        tracks[name], report[name] = track, words
        print(name, [(c['start'], c['end']) for c in track['cues']], flush=True)
    # Replace only after every requested track passed; never leave a partial run.
    with tempfile.NamedTemporaryFile(mode='w', dir=HERE, delete=False) as temp:
        json.dump(tracks, temp, indent=1)
    os.replace(temp.name, HERE / 'cues.json')
    report_path = Path(tempfile.gettempdir()) / 'blockly-word-alignment.json'
    report_path.write_text(json.dumps(report, indent=1))
    print(f'Wrote cues.json; per-word confidence report: {report_path}')


if __name__ == '__main__':
    main()
