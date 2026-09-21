import { describe, it, expect, beforeAll } from 'vitest';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { installJevBlocks, jevLessons } from '../src/index';

beforeAll(() => installJevBlocks());

describe('lessons', () => {
  it('has ten lessons in order', () => {
    expect(jevLessons).toHaveLength(10);
    jevLessons.forEach((l, i) => expect(l.title.startsWith(`${i + 1}.`)).toBe(true));
  });

  const cases = jevLessons.flatMap((lesson) => [
    { name: `${lesson.id} example`, ws: lesson.workspace, calls: lesson.calls },
    { name: `${lesson.id} solution`, ws: lesson.challenge.solution, calls: lesson.challenge.calls },
  ]);
  for (const { name, ws: json, calls: declared } of cases) {
    it(`${name} loads, generates code that uses Jev, and is valid async JavaScript`, () => {
      const ws = new Blockly.Workspace();
      Blockly.serialization.workspaces.load(json as any, ws);
      expect(ws.getTopBlocks(false).length).toBeGreaterThan(0);
      const code = javascriptGenerator.workspaceToCode(ws);
      ws.dispose();
      expect(code).toContain('jev.');
      const calls = (code.match(/await jev\.(noul|choice|score)\(/g) ?? []).length;
      expect(calls).toBeGreaterThan(0);
      expect(declared).toBeGreaterThanOrEqual(calls);
      // Must parse as the body of an async function, exactly how the demo runs it.
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      expect(() => new AsyncFunction('jev', 'print', code)).not.toThrow();
    });
  }

  it('every lesson has theory, a challenge, hints and a solution', () => {
    for (const l of jevLessons) {
      expect(l.theory.length).toBeGreaterThanOrEqual(2);
      expect(l.challenge.text.length).toBeGreaterThan(20);
      expect(l.challenge.hints.length).toBeGreaterThanOrEqual(2);
      expect(l.challenge.solution).toBeTruthy();
    }
  });

  it('makes procedures async so Jev works inside functions', () => {
    const lesson = jevLessons.find((l) => l.id === 'functions')!;
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(lesson.workspace as any, ws);
    const code = javascriptGenerator.workspaceToCode(ws);
    ws.dispose();
    expect(code).toMatch(/(^|\n)async function mood_of\(text\)/);
    expect(code).not.toMatch(/(^|\n)function mood_of/);
    expect(code).toMatch(/\(await mood_of\(/);
  });
});
