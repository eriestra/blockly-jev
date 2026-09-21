/**
 * Runtime used by code generated from the Jev blocks.
 *
 * `jev.noul(state, instructions, criteria?)`, `jev.choice(state, instructions,
 * criteria)` and `jev.score(state, instructions, levels)` each perform one
 * System One request and return that question's answer.
 *
 * Browsers should never hold a TypeSafe API key, so the default runtime posts
 * to a same-origin proxy (see `server/proxy.mjs`) that forwards the request
 * with the key. On a server, wrap a `TypeSafeClient` with `jevFromClient`.
 */

export type EntryType = string | { [key: string]: unknown } | unknown[] | null;

export interface NoulCriteria {
  true?: EntryType;
  false?: EntryType;
}

export type ChoiceCriteria = Record<string, EntryType>;

/** At least two ordered level descriptions, indexed from zero. */
export type ScoreCriteria = [EntryType, EntryType, ...EntryType[]];

export interface NoulAnswer {
  type: 'noul';
  noul: number;
}

export interface ChoiceAnswer<L extends string = string> {
  type: 'choice';
  choice: L;
  confidence: number;
  /** Absent on bounded runtimes that only project scalars, such as Almond. */
  probabilities?: Record<L, number>;
}

export interface ScoreAnswer {
  type: 'score';
  score: number;
  confidence: number;
  /** Absent on bounded runtimes that only project scalars, such as Almond. */
  probabilities?: Record<string, number>;
  legend?: Record<string, EntryType>;
}

export interface JevRuntime {
  noul(state: EntryType, instructions: EntryType, criteria?: NoulCriteria): Promise<NoulAnswer>;
  choice<C extends ChoiceCriteria>(
    state: EntryType,
    instructions: EntryType,
    criteria: C,
  ): Promise<ChoiceAnswer<Extract<keyof C, string>>>;
  score(state: EntryType, instructions: EntryType, criteria: ScoreCriteria): Promise<ScoreAnswer>;
}

interface SystemOneLike {
  systemOne(request: { state: EntryType; questions: Record<string, unknown>; model?: string }): Promise<{
    answers: Record<string, unknown>;
  }>;
}

const QUESTION = 'q';

/** Builds a runtime on anything with a `systemOne` method, such as `TypeSafeClient`. */
export function jevFromClient(client: SystemOneLike, model?: string): JevRuntime {
  const ask = async (question: Record<string, unknown>, state: EntryType) => {
    const res = await client.systemOne({ state, model, questions: { [QUESTION]: question } });
    return res.answers[QUESTION];
  };
  return {
    noul: (state, instructions, criteria) =>
      ask({ type: 'noul', instructions, criteria }, state) as Promise<NoulAnswer>,
    choice: (state, instructions, criteria) =>
      ask({ type: 'choice', instructions, criteria }, state) as Promise<any>,
    score: (state, instructions, criteria) =>
      ask({ type: 'score', instructions, criteria }, state) as Promise<ScoreAnswer>,
  };
}

export interface ProxyOptions {
  /** URL that accepts a System One request body and returns the response. Default: `/api/systemone`. */
  endpoint?: string;
  /** Model override sent with each request. */
  model?: string;
  /** Custom fetch, for tests or non-browser hosts. */
  fetch?: typeof fetch;
  /** Extra headers, for example a session token the proxy checks. */
  headers?: Record<string, string>;
}

/** Builds a browser runtime that sends each request to a proxy holding the API key. */
export function jevFromProxy(options: ProxyOptions = {}): JevRuntime {
  const endpoint = options.endpoint ?? '/api/systemone';
  const doFetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const client: SystemOneLike = {
    async systemOne(request) {
      const res = await doFetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Jev proxy ${res.status}: ${text || res.statusText}`);
      }
      return res.json();
    },
  };
  return jevFromClient(client, options.model);
}
