# Almond contracts for the Jev runtime

The hosted demo at https://sites.almond.build/blockly-jev/ uses these Almond
protected calls. Recreate them on your own site with `protected_call_put`
after `action_endpoint_put` (key `typesafe`, template
`https://api.typesafe.ai/v1/systemone`) and `secret_put` (key
`typesafe_bearer`, value `Bearer <your TypeSafe API key>`).

Common parts of every contract:

```json
"requestTemplate": {
  "headers": [{ "name": "Authorization", "value": "{{secret.typesafe_bearer}}" }],
  "body": { "model": "jev-latest", "state": "{{input.state}}", "questions": { "q": { ... } } }
}
```

| Key | Inputs | Question `q` | Response fields |
| --- | --- | --- | --- |
| `jev_noul` | `state`, `instructions` | `{type: noul, instructions}` | `noul` |
| `jev_noul_described` | + `yes_means`, `no_means` | `criteria: {true, false}` | `noul` |
| `jev_score_N` (N = 2..5) | + `l1..lN` | `{type: score, criteria: [l1..lN]}` | `score`, `confidence` |
| `jev_choice_N` (N = 2..6) | + `l1,d1..lN,dN` | `criteria: {option_k: {name: lk, meaning: dk}}` | `choice`, `confidence` |

Input string limits: `state` 4096, `instructions` 2000, labels 200,
descriptions and levels 500. Limits used by the demo (Almond's backend quota tier): 60 per minute, 5000
per day, 8 concurrent, 15 s timeout, per call key. Every block is one call, so a Run of the
bundled example uses four.

The page calls `POST https://almond.build/api/invoke/<site-slug>/<key>` with
`{"input": {...}}` and receives `{"ok": true, "output": {...}}`. Almond only
accepts these requests from that site's own pages.

## Canvas and lesson explainers

The September 21 canvas update places generated JavaScript behind the top-right
code button and docks output below Blockly. Zoom and fit use compact 40 px
controls; a compact `Trashcan` subclass preserves Blockly's delete area and
recoverable trash contents. The demo alone installs this presentation factory.

Each lesson includes a narrated, seekable SVG/GSAP explainer. Its audio element
is the clock. Sources: `demo/explainer-player.ts`, `demo/explainer-scenes.ts`,
`demo/explainers/storyboard.md`, `scripts.json`, `voice/`, and `cues.json`.
`python3 demo/explainers/align.py` rebuilds normalized delivery audio in
`demo/public/media/` with no tempo change. Requires ffmpeg, ffprobe and whisper-cli
with `~/.cache/whisper-cpp/ggml-base.en.bin`.

The IACC alignment improvements are applied as global script/transcript matching
and ordered sentence boundaries snapped to detected pauses. English word onsets
inside phrases are estimates anchored to short pauses; they are not claimed as
sample-accurate forced alignment. The Spanish timing model is not copied blindly.
Captions expose those estimates; transcript text remains available without audio.

For publication, register versioned CSS, JavaScript and all ten MP3s with Almond,
replace the compiled audio URLs with the registered URLs, then publish a private
preview before activating. Do not use source-relative `/media/` URLs on Almond.
Keep publication capabilities and private preview receipts outside the repository.

Blockly's standard sound and sprite assets are also hosted on the site so its
sound loader respects Almond's CSP. These files come from Blockly 13.3.0 and
retain Blockly's Apache-2.0 license. No credentials or live judgment results are
embedded in the explainers.

## Intermittent browser request failures · 2026-09-21

An intermittent missing CORS response header was reproduced in Chrome on a
public `jev_noul` call, with successful responses immediately before and after;
the user also observed a `jev_score_3` preflight failure. The origin and public
contract configuration were valid. Platform report: `mn758ae3svm4dnxpa8cfdeb9618exb4r`.

The page adapter now retries a failed judgment up to twice, after 350 ms and
1 s, for browser network failures or HTTP 502/503/504. This is appropriate only
because these contracts compute read-only judgments. It never reruns a whole
program or retries validation, authorization, or rate-limit responses. This is
a page-side mitigation; it does not establish that the upstream header omission
has been repaired. An exhausted retry reports a useful connection error.

The explainer alignment description above is superseded by `align.py` and
`requirements-align.txt`: delivered MP3s stay unchanged and acoustic CTC
alignment provides word starts/ends. Playback now uses a decoded Web Audio
buffer and its clock. See `canvas-explainers-qa.md` for the measured verification.

## Floating Bit widget · 2026-09-22

The live page includes `demo/bit/widget.js`, imported by `demo/main.ts` and bundled
by the normal Vite build. It uses the same Jev runtime as the lesson: Almond
protected calls on the hosted page and the local server proxy during development.
The closed widget is only a floating alpha Three.js polyhedron. Opening it shows
a compact input and arrow send button; answers appear only after interaction.
The shape toggles the panel, and Escape closes it and restores keyboard focus.
There is no sound toggle, title, topic description, or permanent helper copy.

Two parallel calls to the existing `jev_noul` contract check topic relevance
and judge questions or true/false statements, tolerating spelling mistakes. Its context is authored lesson prose plus the
basic programming knowledge needed to interpret the examples. It does not read
workspace edits, hidden solutions, browser storage, or other form fields.
Relevance below 0.65 stays neutral. Answer probability at least 0.60 produces
Yes; at most 0.40 produces No; the uncertain middle stays neutral. Requests time out after 25 seconds and let the learner retry.

The checker dispatches `bit:unlock` on its user gesture, then `bit:exercise` with
`{lessonId, passed}` only after an actual judgment succeeds. Network errors never
become a failed-exercise response. `bit:reset` invalidates prior lesson responses.
Bit does not change the checker’s requirements, verdict, or saved progress.
Original voice clips are immutable assets on `bit-live`; their source is recorded
in `demo/bit/PRODUCT.md`. The standalone player lives in the same folder.

The motion-graphics explainer is first in the lesson panel, before the written
concept and challenge. Its existing playback and caption controls are preserved.

### Reproducible publication

Use Node 22.12 or newer. The release script builds with the exact immutable
Almond asset base, uploads every required asset, and creates a private preview.
No edits to minified JavaScript or separate widget injection are needed.

```sh
npm ci
npm run typecheck
npm test
npm run test:bit
node scripts/publish-almond.mjs prepare bit-widget-v6
# Verify the returned preview, then activate that exact revision:
node scripts/publish-almond.mjs activate bit-widget-v6
```

Each release name must be new because asset paths are immutable. Set
`ALMOND_SITE_CONFIG` to a private JSON file containing production `endpoint`,
`siteId`, and `writeToken`; the default is
`~/.almond-private/blockly-jev-site.json`. Receipts and preview tokens stay beside
that private file, outside the repository. Activation guards against overwriting
a page updated since the preview was prepared. Verify the public URL afterward.
See `docs/bit-widget-qa.md` for acceptance evidence and Fastloop test setup.
