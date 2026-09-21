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

  for (const lesson of jevLessons) {
    it(`${lesson.id} loads, generates code that uses Jev, and is valid async JavaScript`, () => {
      const ws = new Blockly.Workspace();
      Blockly.serialization.workspaces.load(lesson.workspace as any, ws);
      expect(ws.getTopBlocks(false).length).toBeGreaterThan(0);
      const code = javascriptGenerator.workspaceToCode(ws);
      ws.dispose();
      expect(code).toContain('jev.');
      const calls = (code.match(/await jev\.(noul|choice|score)\(/g) ?? []).length;
      expect(calls).toBeGreaterThan(0);
      // Must parse as the body of an async function, exactly how the demo runs it.
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      expect(() => new AsyncFunction('jev', 'print', code)).not.toThrow();
    });
  }

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
