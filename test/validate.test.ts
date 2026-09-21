import { describe, it, expect, vi } from 'vitest';
import { checkChallenge } from '../src/validate';
import { jevLessons } from '../src/lessons';

const lesson = jevLessons[2];

function fakeJev(probs: number[]) {
  let i = 0;
  return {
    noul: vi.fn(async () => ({ type: 'noul', noul: probs[i++ % probs.length] })),
    choice: vi.fn(),
    score: vi.fn(),
  } as any;
}

describe('checkChallenge', () => {
  it('asks one Noul per requirement and passes when all clear the threshold', async () => {
    const jev = fakeJev([0.9, 0.8, 0.95]);
    const r = await checkChallenge(jev, lesson, 'code', ['Send to support'], 'ref');
    expect(jev.noul).toHaveBeenCalledTimes(lesson.challenge.requirements.length);
    expect(r.passed).toBe(true);
    expect(r.message).toBe('Challenge complete.');
    const state = JSON.parse(jev.noul.mock.calls[0][0]);
    expect(state.challenge).toBe(lesson.challenge.text);
    expect(state.learner_program).toBe('code');
    expect(jev.noul.mock.calls[0][1].requirement).toBe(lesson.challenge.requirements[0]);
  });

  it('names the weakest requirement when it fails', async () => {
    const r = await checkChallenge(fakeJev([0.9, 0.2, 0.7]), lesson, 'code', [], 'ref');
    expect(r.passed).toBe(false);
    expect(r.message).toContain(lesson.challenge.requirements[1].toLowerCase());
  });

  it('keeps the state under the Almond limit', async () => {
    const jev = fakeJev([0.9]);
    await checkChallenge(jev, lesson, 'x'.repeat(10000), ['y'.repeat(5000)], 'z'.repeat(10000));
    expect(jev.noul.mock.calls[0][0].length).toBeLessThanOrEqual(4096);
  });
});
