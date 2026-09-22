import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import tracks from '../demo/explainers/cues.json';
import scripts from '../demo/explainers/scripts.json';

describe('narration alignment', () => {
  it.each(Object.entries(tracks))('%s timings cover the exact delivered audio and script', (name, track) => {
    const mp3 = readFileSync(`demo/public/media/${name}.mp3`);
    expect(createHash('sha256').update(mp3).digest('hex')).toBe(track.alignment.audioSha256);
    expect(track.cues.map(c => c.text).join(' ')).toBe(scripts[name as keyof typeof scripts]);
    let previousEnd = 0;
    for (const cue of track.cues) {
      expect(cue.start).toBeGreaterThanOrEqual(previousEnd);
      expect(cue.end).toBeLessThanOrEqual(track.total);
      expect(cue.words.map(w => w[0]).join(' ')).toBe(cue.text);
      expect(cue.wordEnds).toHaveLength(cue.words.length);
      cue.words.forEach((word, i) => {
        expect(word[1]).toBeGreaterThanOrEqual(previousEnd);
        expect(cue.wordEnds[i]).toBeGreaterThan(Number(word[1]));
        previousEnd = cue.wordEnds[i];
      });
      expect(cue.start).toBe(cue.words[0][1]);
      expect(cue.end).toBe(previousEnd);
    }
  });

  it('changes the Variables scene at the spoken phrase, without the old four-second delay', () => {
    const setMessage = tracks.variables.cues[2];
    expect(setMessage.text).toMatch(/^Set message/);
    // Confirmed by independently transcribing the sentence crop.
    expect(setMessage.start).toBeGreaterThan(9.5);
    expect(setMessage.start).toBeLessThan(10.3);
  });
});
