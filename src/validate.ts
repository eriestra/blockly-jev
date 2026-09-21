import type { JevLesson } from './lessons';
import type { JevRuntime } from './runtime/index';

/**
 * Asks Jev whether a learner's program meets a lesson's challenge.
 *
 * Each challenge lists concrete requirements. Every requirement becomes one
 * narrow yes/no judgment (a Noul) over the same state: the learner's program,
 * its output when it has run, and the reference solution as one valid
 * approach. The challenge passes when every requirement passes; feedback
 * names the requirement that is least satisfied.
 */
export interface RequirementResult {
  requirement: string;
  /** Probability that the requirement is met, from 0 to 1. */
  probability: number;
  passed: boolean;
}

export interface ChallengeCheck {
  passed: boolean;
  results: RequirementResult[];
  /** A short sentence for the learner. */
  message: string;
}

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
  const threshold = options.threshold ?? 0.5;
  const budget = MAX_CHARS - lesson.challenge.text.length - 300;
  const state = JSON.stringify({
    challenge: lesson.challenge.text,
    learner_program: clip(learnerProgram, Math.floor(budget * 0.55)),
    learner_output: learnerOutput.length ? clip(learnerOutput.join('\n'), Math.floor(budget * 0.15)) : null,
    reference_solution: clip(referenceProgram, Math.floor(budget * 0.3)),
  });

  const answers = await Promise.all(
    lesson.challenge.requirements.map((requirement) =>
      jev.noul(
        state,
        {
          question: 'Does `learner_program` satisfy this requirement of `challenge`?',
          requirement,
          notes: [
            'Judge the JavaScript in `learner_program`. `learner_output` is extra evidence when present and null when the program has not run.',
            '`reference_solution` shows one valid way to meet the challenge; different but equivalent code also satisfies the requirement.',
            'Exact wording of printed strings matters only where the requirement quotes it.',
          ],
        },
        {
          true: 'The program clearly does what the requirement says',
          false: 'The requirement is missing, only partly done, or the program still does what the original example did instead',
        },
      ),
    ),
  );

  const results: RequirementResult[] = lesson.challenge.requirements.map((requirement, i) => ({
    requirement,
    probability: answers[i].noul,
    passed: answers[i].noul >= threshold,
  }));
  const passed = results.every((r) => r.passed);
  const weakest = results.reduce((a, b) => (b.probability < a.probability ? b : a));
  return {
    passed,
    results,
    message: passed ? 'Challenge complete.' : `Not yet. Missing: ${weakest.requirement.toLowerCase()}.`,
  };
}
