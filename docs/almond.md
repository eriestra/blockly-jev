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
