import { describe, it, expect, vi } from 'vitest';
import { jevFromAlmond } from '../src/runtime/almond';

function fakeFetch(handler: (key: string, input: any) => any) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const key = url.split('/').pop()!;
    const { input } = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ ok: true, output: handler(key, input), receiptId: 'r' }), { status: 200 });
  });
}

describe('jevFromAlmond', () => {
  it('routes a plain noul and a described noul to different contracts', async () => {
    const fetch = fakeFetch((key) => ({ noul: key === 'jev_noul' ? 0.2 : 0.8 }));
    const jev = jevFromAlmond({ siteSlug: 's', fetch: fetch as any });
    expect((await jev.noul('x', 'q')).noul).toBe(0.2);
    expect((await jev.noul('x', 'q', { true: 'yes', false: 'no' })).noul).toBe(0.8);
    expect(fetch.mock.calls[0][0]).toBe('https://almond.build/api/invoke/s/jev_noul');
  });

  it('maps choice labels to slots and back', async () => {
    const fetch = fakeFetch((key, input) => {
      expect(key).toBe('jev_choice_3');
      expect(input.l2).toBe('technical');
      expect(input.d2).toBe('Bugs');
      return { choice: 'option_2', confidence: 0.9 };
    });
    const jev = jevFromAlmond({ siteSlug: 's', fetch: fetch as any });
    const a = await jev.choice('x', 'q', { billing: null, technical: 'Bugs', sales: null });
    expect(a.choice).toBe('technical');
    expect(a.confidence).toBe(0.9);
  });

  it('sends score levels and rejects unsupported counts', async () => {
    const fetch = fakeFetch((key, input) => ({ score: 1.5, confidence: 0.6 }));
    const jev = jevFromAlmond({ siteSlug: 's', fetch: fetch as any });
    expect((await jev.score('x', 'q', ['a', 'b', 'c'])).score).toBe(1.5);
    expect(fetch.mock.calls[0][0]).toContain('jev_score_3');
    await expect(jev.score('x', 'q', ['a', 'b', 'c', 'd', 'e', 'f'])).rejects.toThrow(/2 to 5/);
  });

  it('surfaces Almond errors', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'protected_call_rate_limited' }), { status: 429, headers: { 'retry-after': '3' } }));
    const jev = jevFromAlmond({ siteSlug: 's', fetch: fetch as any });
    await expect(jev.noul('x', 'q')).rejects.toThrow(/rate_limited.*3s/);
  });
});
