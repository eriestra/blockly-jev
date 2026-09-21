import type { JevLesson } from './lessons';
import type { JevRuntime } from './runtime/index';

/**
 * Asks Jev whether a learner's program meets a lesson's challenge.
 *
 * Two questions over the same state: a Noul for pass/fail and a Choice for
 * the most useful piece of feedback. The reference solution is included as
 * one valid approach, not the only one.
 */
export type ChallengeVerdict = 'complete' | 'missing_jev' | 'wrong_question' | 'wrong_logic' | 'wrong_output' | 'not_started';

export interface ChallengeCheck {
  passed: boolean;
  /** Probability that the challenge is met, from 0 to 1. */
  probability: number;
  verdict: ChallengeVerdict;
  /** Confidence in the verdict, from 0 to 1. */
  confidence: number;
  /** A short sentence for the learner. */
  message: string;
}

export const VERDICT_MESSAGES: Record<ChallengeVerdict, string> = {
  complete: 'Challenge complete.',
  missing_jev: 'Not yet: the program does not ask Jev what the challenge needs.',
  wrong_question: 'Not yet: the Jev question or its options do not match what the challenge asks.',
  wrong_logic: 'Not yet: the blocks around Jev (if, loop, counter or function) do not do what the challenge asks.',
  wrong_output: 'Not yet: the program prints something different from what the challenge asks.',
  not_started: 'Not yet: this still looks like the worked example. Read the challenge and change the blocks.',
};

const MAX_CHARS = 3900; // Almond protected calls cap state at 4096 characters.

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export async function checkChallenge(
  jev: JevRuntime,
  lesson: JevLesson,
  learnerProgram: string,
  learnerOutput: string[],
  referenceProgram: string,
  options: { threshold?: number } = {},
): Promise<ChallengeCheck> {
  const threshold = options.threshold ?? 0.6;
  const budget = MAX_CHARS - lesson.challenge.text.length - 400;
  const state = JSON.stringify({
    lesson: lesson.title,
    challenge: lesson.challenge.text,
    learner_program: clip(learnerProgram, Math.floor(budget * 0.5)),
    learner_output: clip(learnerOutput.join('\n') || '(not run yet)', Math.floor(budget * 0.15)),
    reference_solution: clip(referenceProgram, Math.floor(budget * 0.35)),
  });

  const [pass, verdict] = await Promise.all([
    jev.noul(
      state,
      'Does `learner_program` accomplish `challenge`? Judge the program, using `learner_output` as evidence when present. `reference_solution` is one valid approach; a different structure that meets the challenge also counts.',
      {
        true: 'The program does what the challenge asks: it asks Jev the needed question(s) and uses the answers as required, with matching behaviour',
        false: 'Something the challenge asks for is missing, wrong, or unchanged from the worked example',
      },
    ),
    jev.choice(state, 'What best describes `learner_program` relative to `challenge`?', {
      complete: 'It accomplishes the challenge',
      not_started: 'It is still essentially the worked example, not adapted to the challenge',
      missing_jev: 'It lacks a Jev question (noul, choice or score) the challenge needs',
      wrong_question: 'It asks Jev, but the question, options or levels do not match the challenge',
      wrong_logic: 'The surrounding logic (conditions, loops, counters, functions) does not implement the challenge',
      wrong_output: 'The logic is right but what it prints or returns differs from what the challenge asks',
    }),
  ]);

  const passed = pass.noul >= threshold;
  const chosen = verdict.choice as ChallengeVerdict;
  const finalVerdict: ChallengeVerdict = passed ? 'complete' : chosen === 'complete' ? 'wrong_logic' : chosen;
  return {
    passed,
    probability: pass.noul,
    verdict: finalVerdict,
    confidence: verdict.confidence,
    message: VERDICT_MESSAGES[finalVerdict],
  };
}
