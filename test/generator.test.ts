import { describe, it, expect, beforeAll } from 'vitest';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { installJevBlocks } from '../src/index';

beforeAll(() => installJevBlocks());

function codeFor(json: object): string {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: [json] } }, ws);
  const code = javascriptGenerator.workspaceToCode(ws);
  ws.dispose();
  return code;
}

describe('jev_if', () => {
  it('generates an awaited Noul with a threshold', () => {
    const code = codeFor({
      type: 'jev_if',
      fields: { ASK: 'Is it a refund?', THRESHOLD: 0.7, WITH_CRITERIA: 'FALSE' },
      inputs: { STATE: { block: { type: 'text', fields: { TEXT: 'refund me' } } } },
    });
    expect(code).toContain(`if ((await jev.noul('refund me', "Is it a refund?", undefined)).noul >= 0.7) {`);
    expect(code).not.toContain('else');
  });

  it('includes yes/no criteria when described', () => {
    const code = codeFor({
      type: 'jev_if',
      fields: { ASK: 'Angry?', THRESHOLD: 0.5, WITH_CRITERIA: 'TRUE', YES_MEANS: 'Hostile tone', NO_MEANS: 'Calm' },
    });
    expect(code).toContain(`{"true": "Hostile tone", "false": "Calm"}`);
  });
});

describe('jev_switch', () => {
  it('generates a Choice with one criteria entry per case and an otherwise branch', () => {
    const code = codeFor({
      type: 'jev_switch',
      extraState: { cases: 2, hasDefault: true },
      fields: { ASK: 'Which team?', MIN_CONFIDENCE: 0.6, LABEL0: 'billing', DESC0: 'Money', LABEL1: 'tech', DESC1: '' },
      inputs: { STATE: { block: { type: 'text', fields: { TEXT: 'my card' } } } },
    });
    expect(code).toContain(`await jev.choice('my card', "Which team?", {"billing": "Money", "tech": null})`);
    expect(code).toContain('.confidence < 0.6');
    expect(code).toContain('case "billing":');
    expect(code).toContain('case "tech":');
  });

  it('omits the confidence gate without an otherwise branch', () => {
    const code = codeFor({
      type: 'jev_switch',
      extraState: { cases: 1, hasDefault: false },
      fields: { ASK: 'Q', LABEL0: 'a' },
    });
    expect(code).not.toContain('confidence');
    expect(code).toContain('switch (jevPick.choice)');
  });

  it('round-trips its extra state', () => {
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      { blocks: { languageVersion: 0, blocks: [{ type: 'jev_switch', extraState: { cases: 3, hasDefault: true } }] } },
      ws,
    );
    const saved = Blockly.serialization.workspaces.save(ws) as any;
    expect(saved.blocks.blocks[0].extraState).toEqual({ cases: 3, hasDefault: true });
    ws.dispose();
  });
});

describe('reporters', () => {
  it('jev_noul outputs a Boolean comparison', () => {
    const code = codeFor({
      type: 'controls_if',
      inputs: {
        IF0: { block: { type: 'jev_noul', fields: { ASK: 'Spam?', THRESHOLD: 0.8, WITH_CRITERIA: 'FALSE' },
          inputs: { STATE: { block: { type: 'text', fields: { TEXT: 'buy now' } } } } } },
      },
    });
    expect(code).toContain(`if ((await jev.noul('buy now', "Spam?", undefined)).noul >= 0.8) {`);
  });

  it('jev_probability outputs a Number usable in arithmetic', () => {
    const code = codeFor({
      type: 'math_arithmetic',
      fields: { OP: 'MULTIPLY' },
      inputs: {
        A: { block: { type: 'jev_probability', fields: { ASK: 'angry', WITH_CRITERIA: 'FALSE' } } },
        B: { block: { type: 'math_number', fields: { NUM: 100 } } },
      },
    });
    expect(code).toContain(`(await jev.noul('', "angry", undefined)).noul * 100`);
  });

  it('jev_choice outputs the picked label and honours its option count', () => {
    const code = codeFor({
      type: 'jev_choice',
      extraState: { count: 3 },
      fields: { ASK: 'Lang?', LABEL0: 'es', LABEL1: 'en', DESC1: 'English', LABEL2: 'fr' },
    });
    expect(code).toContain(`(await jev.choice('', "Lang?", {"es": null, "en": "English", "fr": null})).choice`);
  });

  it('jev_score outputs the expected score over ordered levels', () => {
    const code = codeFor({
      type: 'jev_score',
      extraState: { count: 3 },
      fields: { ASK: 'Urgency?', DESC0: 'no rush', DESC1: 'soon', DESC2: 'now' },
    });
    expect(code).toContain(`(await jev.score('', "Urgency?", ["no rush", "soon", "now"])).score`);
  });

  it('count mutators clamp to their minimum and round-trip', () => {
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      { blocks: { languageVersion: 0, blocks: [{ type: 'jev_choice', extraState: { count: 1 } }] } },
      ws,
    );
    const saved = Blockly.serialization.workspaces.save(ws) as any;
    expect(saved.blocks.blocks[0].extraState).toEqual({ count: 2 });
    ws.dispose();
  });
});
