import { describe, it, expect, vi } from 'vitest';
import { askWithTimeout, classify, questionState } from '../demo/bit/bit-question.js';
describe('Bit judgment', () => {
 it('preserves high-confidence yes/no and keeps uncertainty neutral', () => {
  expect(classify(.99,.9)).toBe('yes');
  expect(classify(.99,.1)).toBe('no');
  expect(classify(.99,.5)).toBe('unknown');
  expect(classify(.1,.9)).toBe('unknown');
  expect(()=>classify(.99,NaN)).toThrow();
 });
 it('accepts the reported misspelled statement as input to the judgment', async () => {
  const runtime={noul:vi.fn().mockResolvedValue({noul:.95})};
  expect(await askWithTimeout(runtime,'Blocks can be nested.','Instuctions can contain more instructions')).toBe('yes');
  const [state,prompt]=runtime.noul.mock.calls[0];
  expect(JSON.parse(state).question).toBe('Instuctions can contain more instructions');
  expect(prompt).toContain('statements');
 });
 it('releases a stalled request with a retryable error', async () => {
  vi.useFakeTimers();
  try{
   const pending=askWithTimeout({noul:()=>new Promise(()=>{})},'lesson','question',25000);
   const assertion=expect(pending).rejects.toThrow('timed out');
   await vi.advanceTimersByTimeAsync(25000);await assertion;
  }finally{vi.useRealTimers()}
 });
 it('bounds context without changing the submitted statement',()=>{
  const state=JSON.parse(questionState('x'.repeat(5000),' statement '));
  expect(state.lesson).toHaveLength(2800);expect(state.question).toBe('statement');
 });
});
