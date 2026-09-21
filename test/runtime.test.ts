import { describe, it, expect, vi } from 'vitest';
import { jevFromProxy, jevFromClient } from '../src/runtime/index';

describe('jevFromProxy', () => {
  it('posts one question and unwraps its answer', async () => {
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.questions.q.type).toBe('noul');
      return new Response(JSON.stringify({ model: 'jev-test', answers: { q: { type: 'noul', noul: 0.9 } }, usage: {} }), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    });
    const jev = jevFromProxy({ fetch: fetch as any, endpoint: '/x' });
    const a = await jev.noul('hi', 'Is it a greeting?');
    expect(a.noul).toBe(0.9);
    expect(fetch).toHaveBeenCalledWith('/x', expect.objectContaining({ method: 'POST' }));
  });

  it('throws on non-2xx', async () => {
    const jev = jevFromProxy({ fetch: (async () => new Response('nope', { status: 500 })) as any });
    await expect(jev.noul('x', 'y')).rejects.toThrow(/500/);
  });
});

describe('jevFromClient', () => {
  it('returns the choice answer', async () => {
    const client = { systemOne: async () => ({ answers: { q: { type: 'choice', choice: 'a', confidence: 1, probabilities: { a: 1, b: 0 } } } }) };
    const jev = jevFromClient(client);
    const a = await jev.choice('s', 'q', { a: null, b: null });
    expect(a.choice).toBe('a');
  });
});

describe('score', () => {
  it('sends ordered levels as criteria', async () => {
    const systemOne = vi.fn(async () => ({ answers: { q: { type: 'score', score: 1.4, confidence: 0.7, probabilities: {}, legend: {} } } }));
    const jev = jevFromClient({ systemOne });
    const a = await jev.score('s', 'urgency', ['low', 'high']);
    expect(a.score).toBe(1.4);
    expect(systemOne).toHaveBeenCalledWith(expect.objectContaining({
      questions: { q: { type: 'score', instructions: 'urgency', criteria: ['low', 'high'] } },
    }));
  });
});
