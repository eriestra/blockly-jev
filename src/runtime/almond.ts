import type { ChoiceAnswer, ChoiceCriteria, EntryType, JevRuntime, NoulAnswer, NoulCriteria, ScoreAnswer, ScoreCriteria } from './index';

/**
 * Runtime for pages hosted on Almond (https://almond.build).
 *
 * Almond keeps the TypeSafe key server-side and exposes fixed, quota-limited
 * "protected calls" that a public page may invoke. Their inputs are scalars,
 * so this runtime uses one contract per shape:
 *
 *   jev_noul             state, instructions
 *   jev_noul_described   state, instructions, yes_means, no_means
 *   jev_score_<n>        state, instructions, l1..ln          (n = 2..5)
 *   jev_choice_<n>       state, instructions, l1,d1..ln,dn    (n = 2..6)
 *
 * Choice options are sent as slots option_1..option_n whose descriptions carry
 * the real label and meaning; the picked slot is mapped back to its label.
 * Only the projected scalars come back, so `probabilities` is absent here.
 */

export const ALMOND_MAX_SCORE_LEVELS = 5;
export const ALMOND_MAX_CHOICE_OPTIONS = 6;

export interface AlmondOptions {
  /** Site slug, the first path segment on sites.almond.build. Defaults to the current page's. */
  siteSlug?: string;
  /** Almond origin that serves /api/invoke. Default: https://almond.build */
  origin?: string;
  fetch?: typeof fetch;
}

function text(value: EntryType): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function jevFromAlmond(options: AlmondOptions = {}): JevRuntime {
  const origin = options.origin ?? 'https://almond.build';
  const slug =
    options.siteSlug ??
    (typeof location !== 'undefined' ? location.pathname.split('/').filter(Boolean)[0] : undefined);
  if (!slug) throw new Error('jevFromAlmond needs a siteSlug outside an Almond page');
  const doFetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  async function invoke(key: string, input: Record<string, string | number | boolean>): Promise<any> {
    const url = `${origin}/api/invoke/${slug}/${key}`;
    const request: RequestInit = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input }),
    };
    let res!: Response;
    // These contracts only compute judgments. Retry the failed judgment, never
    // the whole program (which could print duplicate output or repeat other work).
    const delays = [350, 1000];
    for (let attempt = 0; ; attempt++) {
      try {
        res = await doFetch(url, request);
        if (![502, 503, 504].includes(res.status) || attempt === delays.length) break;
      } catch (cause) {
        if (!(cause instanceof TypeError)) throw cause;
        if (attempt === delays.length) {
          throw new Error('Could not reach Jev after three attempts. Please try Run again in a moment.', { cause });
        }
      }
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      const retry = res.headers.get('retry-after');
      throw new Error(`Almond call ${key} failed: ${body.error ?? res.status}${retry ? ` (retry in ${retry}s)` : ''}`);
    }
    return body.output;
  }

  return {
    async noul(state, instructions, criteria?: NoulCriteria): Promise<NoulAnswer> {
      const yes = text(criteria?.true ?? null);
      const no = text(criteria?.false ?? null);
      const out =
        yes || no
          ? await invoke('jev_noul_described', { state: text(state), instructions: text(instructions), yes_means: yes, no_means: no })
          : await invoke('jev_noul', { state: text(state), instructions: text(instructions) });
      return { type: 'noul', noul: Number(out.noul) };
    },

    async choice<C extends ChoiceCriteria>(state: EntryType, instructions: EntryType, criteria: C) {
      const labels = Object.keys(criteria);
      const n = labels.length;
      if (n < 2 || n > ALMOND_MAX_CHOICE_OPTIONS) {
        throw new Error(`Almond runtime supports 2 to ${ALMOND_MAX_CHOICE_OPTIONS} choice options, got ${n}`);
      }
      const input: Record<string, string> = { state: text(state), instructions: text(instructions) };
      labels.forEach((label, i) => {
        input[`l${i + 1}`] = label;
        input[`d${i + 1}`] = text(criteria[label]);
      });
      const out = await invoke(`jev_choice_${n}`, input);
      const slot = Number(String(out.choice).replace('option_', '')) - 1;
      const picked = labels[slot] ?? labels[0];
      return {
        type: 'choice',
        choice: picked as Extract<keyof C, string>,
        confidence: Number(out.confidence),
      } as ChoiceAnswer<Extract<keyof C, string>>;
    },

    async score(state, instructions, criteria: ScoreCriteria): Promise<ScoreAnswer> {
      const n = criteria.length;
      if (n < 2 || n > ALMOND_MAX_SCORE_LEVELS) {
        throw new Error(`Almond runtime supports 2 to ${ALMOND_MAX_SCORE_LEVELS} score levels, got ${n}`);
      }
      const input: Record<string, string> = { state: text(state), instructions: text(instructions) };
      criteria.forEach((level, i) => {
        input[`l${i + 1}`] = text(level);
      });
      const out = await invoke(`jev_score_${n}`, input);
      return { type: 'score', score: Number(out.score), confidence: Number(out.confidence) };
    },
  };
}
