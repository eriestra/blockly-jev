#!/usr/bin/env python3
"""Audio-first alignment for the lesson explainers (one continuous take per lesson).

Same method as the lander explainer's align2.py: whisper.cpp gives the rough position of every
sentence, a word-share model gives a second estimate, and a DP assigns sentence boundaries to
distinct pauses (ffmpeg silencedetect) in order. Sentence boundaries snapped to real pauses are
what keeps the visuals in sync; whisper word times alone drift.

Input : scripts.json (lesson id -> narration text), voice/<id>.mp3 (Higgsfield take)
Output: ../public/media/<id>.mp3 (0.4 s lead, loudnorm, 1.2 s tail, 128k) and cues.json
        { id: { cues: [{i, text, start, end}], total } } with times relative to the output mp3.
Usage : python3 align.py [id ...]   (defaults to every id in scripts.json)
"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.expanduser("~/.cache/whisper-cpp/ggml-base.en.bin")
LEAD, TAIL = 0.4, 1.2
OUT_DIR = os.path.join(HERE, "..", "public", "media")
os.makedirs(OUT_DIR, exist_ok=True)


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def run(a):
    return subprocess.run(a, check=True, capture_output=True, text=True)


def dur(f):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout)


def words_of(path, tmp):
    """Word list with times interpolated inside whisper SEGMENTS (segment timestamps come from the decoder's
    timestamp tokens and stay steady; per-word timestamps from -ml 1 drift several seconds late in a take)."""
    w16 = os.path.join(tmp, "w16.wav")
    run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", path, "-ar", "16000", "-ac", "1", w16])
    run(["whisper-cli", "-m", MODEL, "-f", w16, "-oj", "-of", os.path.join(tmp, "w16"), "-nt"])
    seg = json.load(open(os.path.join(tmp, "w16.json")))["transcription"]
    words = []
    for s in seg:
        ws = [norm(w) for w in s["text"].split() if norm(w)]
        t0, t1 = s["offsets"]["from"] / 1000, s["offsets"]["to"] / 1000
        n = len(ws)
        for k, w in enumerate(ws):
            words.append((w, t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n))
    return words


def silences(path, db=-38, d=0.25):
    out = subprocess.run(["ffmpeg", "-nostdin", "-i", path, "-af", f"silencedetect=noise={db}dB:d={d}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(st, en + [dur(path)] * (len(st) - len(en))))


def align_take(text, take, tmp):
    T = dur(take); W = words_of(take, tmp); SIL = silences(take)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]
    counts = [len(s.split()) for s in sentences]; n = len(sentences)
    # IACC update: global sequence matching cannot derail after one misheard phrase.
    sw = [norm(w) for s in sentences for w in s.split()]
    ww = [w[0] for w in W]
    if not ww: raise ValueError(f"No transcription for {take}")
    from difflib import SequenceMatcher
    n1, n2 = len(sw), len(ww)
    scores = [[0] * (n2 + 1) for _ in range(n1 + 1)]
    for i in range(n1 + 1): scores[i][0] = -i
    for j in range(n2 + 1): scores[0][j] = -j
    def sim(a,b): return 2 if a == b else (1 if SequenceMatcher(None,a,b).ratio() > .72 else -1)
    for i in range(1, n1+1):
        for j in range(1,n2+1):
            scores[i][j] = max(scores[i-1][j-1] + sim(sw[i-1],ww[j-1]), scores[i-1][j]-1, scores[i][j-1]-1)
    mp = {}; i,j = n1,n2
    while i and j:
        if scores[i][j] == scores[i-1][j-1] + sim(sw[i-1],ww[j-1]):
            if sim(sw[i-1],ww[j-1]) > 0: mp[i-1] = j-1
            i -= 1; j -= 1
        elif scores[i][j] == scores[i-1][j]-1: i -= 1
        else: j -= 1
    matched = sorted(mp)
    if not matched: raise ValueError(f"Script and narration did not match: {take}")
    for q in range(n1):
        if q not in mp: mp[q] = mp[min(matched, key=lambda x:abs(x-q))]
    # Enforce monotone hints across unmatched regions.
    for q in range(1,n1): mp[q] = max(mp[q],mp[q-1])
    ends_w = []; pos = 0
    for c in counts:
        ends_w.append(W[mp[pos + c - 1]][2]); pos += c
    # word-share estimate over the speech span
    speech0 = SIL[0][1] if SIL and SIL[0][0] < 0.05 else 0.0
    speech1 = SIL[-1][0] if SIL and SIL[-1][1] >= T - 0.05 else T
    cum = 0; ends_p = []
    for c in counts:
        cum += c; ends_p.append(speech0 + (speech1 - speech0) * cum / sum(counts))
    P = [(a, b) for a, b in SIL if a > 0.3 and b < T - 0.05]
    INF = 1e9; m = n - 1
    if len(P) < m:
        P = [(a,b) for a,b in silences(take, db=-40, d=.15) if a > .15 and b < T-.05]
    if len(P) < m: raise ValueError(f"{take}: only {len(P)} pauses for {m} sentence boundaries")
    cost = lambda bi, pi: min(abs(P[pi][0] - ends_w[bi]), abs(P[pi][0] - ends_p[bi]) * 1.3) - 0.6 * min(P[pi][1] - P[pi][0], 1.5)
    dp = [[INF] * (len(P) + 1) for _ in range(m + 1)]; back = [[-1] * (len(P) + 1) for _ in range(m + 1)]
    for p in range(len(P) + 1): dp[0][p] = 0
    for b in range(1, m + 1):
        for p in range(1, len(P) + 1):
            dp[b][p] = dp[b][p - 1]; back[b][p] = -1
            v = dp[b - 1][p - 1] + cost(b - 1, p - 1)
            if v < dp[b][p]: dp[b][p] = v; back[b][p] = p - 1
    picks = []; b, p = m, len(P)
    while b > 0 and p > 0:
        if back[b][p] == -1: p -= 1
        else: picks.append(back[b][p]); b -= 1; p -= 1
    picks = picks[::-1]
    if len(picks) != m:
        raise SystemExit(f"{take}: needed {m} boundaries, found {len(picks)} pauses; lower the silence threshold")
    starts = [speech0] + [P[i][1] for i in picks]; ends = [P[i][0] for i in picks] + [speech1]
    cues = []
    short_pauses = silences(take, db=-40, d=.10)
    for i, (s, a, e, ew) in enumerate(zip(sentences, starts, ends, ends_w)):
        cues.append({"i": i, "text": s, "start": round(a + LEAD, 2), "end": round(e + LEAD, 2), "words": phrase_words(s,a,e,short_pauses)})
        print(f"  {i:2d} {a+LEAD:6.2f}-{e+LEAD:6.2f}  (whisper end {ew+LEAD:6.2f})  {s[:70]}")
    return cues, round(T + LEAD + TAIL, 2)


def phrase_words(sentence, start, end, pauses):
    """English word onsets are estimates within pause-anchored phrases, not forced alignment.
    All scene boundaries are measured; phrase anchors keep small caption/beat errors local.
    Do not transplant the Spanish syllable timing model unchanged to English.
    """
    words = sentence.split()
    weights = [max(1, len(re.findall(r"[aeiouy]+", norm(w)))) + .35 for w in words]
    total = sum(weights); cumulative = [sum(weights[:j]) / total for j in range(len(words)+1)]
    bounds = [(0,start,start)]
    for a,b in pauses:
        if not start+.15 < a < b < end-.15: continue
        candidates = range(bounds[-1][0]+1,len(words))
        if not candidates: continue
        j = min(candidates,key=lambda j:abs(start+(end-start)*cumulative[j]-a) - (.3 if words[j-1].endswith((',',':',';')) else 0))
        if abs(start+(end-start)*cumulative[j]-a) < 1.3: bounds.append((j,a,b))
    bounds.append((len(words),end,end))
    result=[]
    for (i,_,a),(j,b,_) in zip(bounds,bounds[1:]):
        segment=sum(weights[i:j]); used=0
        for k in range(i,j):
            result.append([words[k],round(a+(b-a)*used/segment+LEAD,2)])
            used+=weights[k]
    return result


def main():
    scripts = json.load(open(os.path.join(HERE, "scripts.json")))
    ids = sys.argv[1:] or list(scripts)
    cues_path = os.path.join(HERE, "cues.json")
    all_cues = json.load(open(cues_path)) if os.path.exists(cues_path) else {}
    with tempfile.TemporaryDirectory() as tmp:
        for id_ in ids:
            take = os.path.join(HERE, "voice", f"{id_}.mp3")
            print(f"== {id_}  ({dur(take):.1f} s)")
            cues, total = align_take(scripts[id_], take, tmp)
            out = os.path.join(OUT_DIR, f"{id_}.mp3")
            lead = int(LEAD * 1000)
            run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", take, "-af",
                 f"adelay={lead}|{lead},apad=whole_dur={total},loudnorm=I=-16:TP=-1.5:LRA=9,aformat=sample_rates=44100:channel_layouts=stereo",
                 "-c:a", "libmp3lame", "-b:a", "128k", out])
            all_cues[id_] = {"cues": cues, "total": total}
            print(f"  total {total} s -> {os.path.relpath(out, HERE)}")
    json.dump(all_cues, open(cues_path, "w"), indent=1)
    print("wrote cues.json")


if __name__ == "__main__":
    main()
