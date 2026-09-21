import { describe, it, expect, vi } from 'vitest';
import { checkChallenge } from '../src/validate';
import { jevLessons } from '../src/lessons';

const lesson = jevLessons[2];

function fakeJev(noul: number, choice: string) {
  return {
    noul: vi.fn(async () => ({ type: 'noul', noul })),
    choice: vi.fn(async () => ({ type: 'choice', choice, confidence: 0.8 })),
    score: vi.fn(),
  } as any;
}

describe('checkChallenge', () => {
  it('passes when the Noul clears the threshold', async () => {
    const jev = fakeJev(0.9, 'complete');
    const r = await checkChallenge(jev, lesson, 'code', ['Send to support'], 'ref');
    expect(r.passed).toBe(true);
    expect(r.verdict).toBe('complete');
    const state = JSON.parse(jev.noul.mock.calls[0][0]);
    expect(state.challenge).toBe(lesson.challenge.text);
    expect(state.learner_program).toBe('code');
  });

  it('returns the feedback verdict when it fails', async () => {
    const r = await checkChallenge(fakeJev(0.2, 'wrong_question'), lesson, 'code', [], 'ref');
    expect(r.passed).toBe(false);
    expect(r.verdict).toBe('wrong_question');
    expect(r.message).toMatch(/question/);
  });

  it('never reports complete as the reason for a failure', async () => {
    const r = await checkChallenge(fakeJev(0.3, 'complete'), lesson, 'code', [], 'ref');
    expect(r.verdict).toBe('wrong_logic');
  });

  it('keeps the state under the Almond limit', async () => {
    const jev = fakeJev(0.9, 'complete');
    await checkChallenge(jev, lesson, 'x'.repeat(10000), ['y'.repeat(5000)], 'z'.repeat(10000));
    expect(jev.noul.mock.calls[0][0].length).toBeLessThanOrEqual(4096);
  });
});
