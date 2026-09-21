# blockly-jev

A [Blockly](https://developers.google.com/blockly) extension that puts
[TypeSafe](https://typesafe.ai) **Jev** judgments into blocks.

Jev is a System One model: it reads natural language and returns typed
answers with probabilities instead of generating text. This package makes
those answers first-class Blockly values, so any stock block that takes a
Boolean, Number or String can be driven by a Jev judgment. Two statement
blocks give the common shapes a shortcut.

| Block | Kind | Jev primitive | Output | Plugs into |
| --- | --- | --- | --- | --- |
| `jev_noul` | reporter | [Noul](https://docs.typesafe.ai/primitives/noul) | Boolean (probability ≥ threshold) | if, while, and/or/not, ternary, list filters |
| `jev_probability` | reporter | Noul | Number 0–1 | math, compare, sort keys, weighted scoring |
| `jev_choice` | reporter | [Choice](https://docs.typesafe.ai/primitives/choice) | String (picked option) | text compare, variables, list index |
| `jev_score` | reporter | [Score](https://docs.typesafe.ai/primitives/score) | Number (expected level) | math, compare, sort, thresholds |
| `jev_if` | statement | Noul | runs then/else | anywhere a statement goes |
| `jev_switch` | statement | Choice | runs the matching case, or otherwise | anywhere a statement goes |

Reporter blocks with a variable number of rows (`jev_choice` options,
`jev_score` levels) grow with +/− buttons on the block. `jev_switch` uses the
standard mutator gear so cases can be reordered.

**Live demo:** https://sites.almond.build/blockly-jev/ (hosted on Almond, quota-limited).

## Install

```sh
npm install blockly-jev blockly
```

```ts
import * as Blockly from 'blockly';
import { installJevBlocks, jevToolboxCategory, jevFromProxy } from 'blockly-jev';

installJevBlocks(); // registers blocks and the JavaScript generator

const workspace = Blockly.inject('blockly', {
  toolbox: { kind: 'categoryToolbox', contents: [jevToolboxCategory, /* your categories */] },
});
```

## Running generated code

Every Jev block compiles to an awaited call on a `jev` object, so run the
generated code inside an async function with a runtime in scope:

```ts
import { javascriptGenerator } from 'blockly/javascript';
import { jevFromProxy } from 'blockly-jev/runtime';

const jev = jevFromProxy();                 // posts to /api/systemone by default
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = new AsyncFunction('jev', javascriptGenerator.workspaceToCode(workspace));
await run(jev);
```

The runtime interface is small and you can implement it yourself:

```ts
interface JevRuntime {
  noul(state, instructions, criteria?): Promise<{ noul: number }>;
  choice(state, instructions, criteria): Promise<{ choice: string; confidence: number; probabilities }>;
  score(state, instructions, levels): Promise<{ score: number; confidence: number; probabilities }>;
}
```

### Hosting on Almond

`jevFromAlmond()` (also exported from `blockly-jev/runtime/almond`) runs the
same blocks on an [Almond](https://almond.build) page with no server of your
own. Almond stores the TypeSafe key as a site secret and exposes fixed,
quota-limited protected calls that only that site's pages can invoke. Because
those calls take scalar inputs, the runtime uses one contract per shape:
`jev_noul`, `jev_noul_described`, `jev_score_2..5` and `jev_choice_2..6`
(options travel as slots whose descriptions carry the real label and meaning,
and the picked slot is mapped back). `probabilities` is not available on this
runtime. The contracts are defined once with Almond's `protected_call_put`;
see `docs/almond.md` for the exact templates.

### Keep the API key on a server

Browsers must not hold `TYPESAFE_API_KEY`. `jevFromProxy` sends each request
to a same-origin endpoint; `server/proxy.mjs` is a dependency-free Node
proxy that validates the body and forwards it with the official SDK. On a
server or in Node, use `jevFromClient(new TypeSafeClient())` directly.

## Learn to code with Jev: ten lessons

`jevLessons` (also `blockly-jev/lessons`) is a curriculum of ten workspaces
with teacher text, each introducing one programming idea and using Jev in it.
The hosted demo has a lesson picker; the URL hash selects a lesson, for example
`https://sites.almond.build/blockly-jev/#functions`.

| # | Lesson | Idea | Jev's part | Calls per run |
| --- | --- | --- | --- | --- |
| 1 | Hello, world | sequence, output, values | a true/false value from a yes/no question | 1 |
| 2 | Variables | naming and reusing values | a probability as a number | 1 |
| 3 | If and else | branching | Noul as the condition, threshold | 1 |
| 4 | Numbers and comparisons | numbers, `<` `=` `>` | Score on a described scale | 1 |
| 5 | Choosing between many options | switch, default case | Choice with described options, confidence gate | 1 |
| 6 | Lists and loops | collections, for-each | one judgment per item | 3 |
| 7 | Counting with a loop | accumulator | Noul inside the loop | 3 |
| 8 | Combining conditions | and, or, not | two independent judgments combined | 2 |
| 9 | Functions | parameters, reuse | a judgment wrapped as a function | 2 |
| 10 | A small assistant | everything together | category plus urgency per message, rules in code | 6 |

Blockly's stock function blocks generate plain functions; the package makes
them `async` and awaits calls, so Jev reporters work inside functions.

```ts
import { jevLessons } from 'blockly-jev/lessons';
Blockly.serialization.workspaces.load(jevLessons[8].workspace, workspace);
```

## Generated code

```js
// jev_if
if ((await jev.noul(ticket, "Is the customer asking for a refund?", undefined)).noul >= 0.5) {
  ...
} else {
  ...
}

// jev_switch with an "otherwise" branch and a confidence gate
{
  const jevPick = await jev.choice(ticket, "Which team should handle this?", {"billing": "Charges, invoices", "technical": null});
  if (jevPick.confidence < 0.6) {
    ...
  } else switch (jevPick.choice) {
    case "billing": { ... break; }
    case "technical": { ... break; }
  }
}

// reporters inside stock blocks
if ((await jev.noul(ticket, "Is the customer angry?", undefined)).noul >= 0.7) { ... }
score = (await jev.score(ticket, "How urgent is this?", ["No rush", "Soon", "Now"])).score * 10;
```

## Demo

```sh
cp .env.example .env   # add TYPESAFE_API_KEY
npm install
npm run dev            # proxy on :8787, Vite on :5173
```

The demo loads a support-ticket example that uses every block, shows the
generated JavaScript live, and runs it against Jev when you press Run.
For the bundled ticket ("I was charged twice this month. Please refund the
second charge, this is urgent.") a run against `jev-latest` printed:

```
Refund flow
Route to billing
Urgency 0-2: 1.88
```

## Semantics worth knowing

- A Noul near 0.5 means yes and no are about equally likely, not "medium".
  Pick thresholds on your own data.
- Choice `confidence` describes how concentrated the probability distribution
  is. `jev_switch` only consults it when an "otherwise" branch exists.
- Score is the probability-weighted position on the levels you describe, so it
  can land between integers. Each level should describe a concrete situation.
- Each block is one request. Independent questions over the same state can be
  batched into one request (TypeSafe's fan-out pattern); a batching block is on
  the roadmap.

## Roadmap

- `jev_ask` batching block: several questions, one request, answers into variables.
- List helpers: filter by Noul, sort by Score, "pick the best item" as a Choice
  over list items.
- A "define judgment" procedure block for reusable questions.
- Python generator.

## Development

```sh
npm test          # vitest, headless Blockly
npm run typecheck
npm run build     # library to dist/
```

MIT.
