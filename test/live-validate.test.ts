// @vitest-environment node
/**
 * Live check against the real Jev model. Runs only with JEV_LIVE=1 and a
 * TYPESAFE_API_KEY in the environment; every solution must pass and every
 * untouched example must fail.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { installJevBlocks, jevLessons, jevFromClient, checkChallenge } from '../src/index';

const live = process.env.JEV_LIVE === '1';

function codeOf(ws: Record<string, unknown>): string {
  const w = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(ws as any, w);
  const code = javascriptGenerator.workspaceToCode(w);
  w.dispose();
  return code;
}

/** Partial attempts that must still fail, with the requirement index expected to be weakest. */
const PARTIALS: Record<string, { code: string; weakest: number }> = {
  hello: {
    code: `print('¡Hola, mundo!');\nprint(((await jev.noul('¡Hola, mundo!', "Is this text a greeting?", undefined)).noul >= 0.5));\n`,
    weakest: 2,
  },
  'if-else': {
    code: `var message;\nmessage = 'The app deleted my notes twice this week.';\nif ((await jev.noul(message, "Is this message a complaint?", undefined)).noul >= 0.5) {\n  print('Send to support');\n} else {\n  print('Send to marketing');\n}\n`,
    weakest: 1,
  },
  counting: {
    code: `var questions, message;\nquestions = 0;\nvar message_list = ['Where can I download my invoice?', 'Everything works now, thank you.', 'Is there a student discount?'];\nfor (var i in message_list) {\n  message = message_list[i];\n  if ((await jev.noul(message, "Is this message a question?", undefined)).noul >= 0.5) {\n    questions = questions + 1;\n  }\n}\nprint('Done');\n`,
    weakest: 2,
  },
};

describe.skipIf(!live)('live challenge checks', () => {
  let jev: ReturnType<typeof jevFromClient>;
  beforeAll(async () => {
    installJevBlocks();
    const { TypeSafeClient } = await import('@typesafe-ai/sdk');
    jev = jevFromClient(new TypeSafeClient());
  });

  for (const lesson of jevLessons) {
    it(`${lesson.id}: solution passes, example fails`, async () => {
      const reference = codeOf(lesson.challenge.solution);
      const example = codeOf(lesson.workspace);
      const [sol, ex] = await Promise.all([
        checkChallenge(jev, lesson, reference, [], reference),
        checkChallenge(jev, lesson, example, [], reference),
      ]);
      const fmt = (r: typeof sol) => r.results.map((x) => x.probability.toFixed(2)).join(' ');
      console.log(`${lesson.id.padEnd(12)} solution [${fmt(sol)}] ${sol.passed ? 'PASS' : 'FAIL'} | example [${fmt(ex)}] ${ex.passed ? 'PASS' : 'FAIL'}`);
      expect(sol.passed, `solution should pass: ${sol.message}`).toBe(true);
      expect(ex.passed, 'untouched example should fail').toBe(false);
      const partial = PARTIALS[lesson.id];
      if (partial) {
        const p = await checkChallenge(jev, lesson, partial.code, [], reference);
        console.log(`${''.padEnd(12)} partial  [${fmt(p)}] ${p.passed ? 'PASS' : 'FAIL'}`);
        expect(p.passed, 'partial attempt should fail').toBe(false);
        const weakest = p.results.reduce((a, b, i, arr) => (b.probability < arr[a].probability ? i : a), 0);
        expect(weakest).toBe(partial.weakest);
      }
    }, 60000);
  }
});
