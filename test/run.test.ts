import { describe, it, expect } from 'vitest';
import { runJevProgram } from '../src/runtime/run';

describe('runJevProgram', () => {
  it('runs generated code with the given scope', async () => {
    const out: string[] = [];
    const jev = { noul: async () => ({ type: 'noul', noul: 0.9 }) };
    await runJevProgram(`if ((await jev.noul('x', 'q')).noul >= 0.5) { print('yes'); }`, { jev, print: (v: unknown) => out.push(String(v)) });
    expect(out).toEqual(['yes']);
  });

  it('rejects on runtime errors', async () => {
    await expect(runJevProgram(`throw new Error('boom');`, {})).rejects.toThrow('boom');
  });
});
