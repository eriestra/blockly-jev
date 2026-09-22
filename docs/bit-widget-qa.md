# Bit widget acceptance

Canonical source: `demo/bit/`. Context: `PRODUCT.md` and `DESIGN.md` in that folder.
The app imports the widget during its normal build; no external local project or
manual script insertion is required. Node 22.12+ is required.

## Automated checks

- `npm run typecheck`: library TypeScript checks.
- `npm test`: 68 passing tests; ten opt-in live validation tests remain skipped.
- `npm run test:bit`: 192 triangles, valid outward faces, eight exact Yes planes;
  Noul eligibility, uncertainty, invalid-answer handling, and escaped payload bounds.
- `npm run build:demo:almond`: hosted app with integrated widget.
- `npm run build:bit`: standalone player, preserving its original controls/audio.

## Browser checks

Use the user's Fastloop checkout and its Chrome debugging connection. This test
runs actual Jev requests and restores viewport emulation even if an assertion fails.

```sh
FASTLOOP_MODULE=/path/to/almond-fastloop.mjs \
BIT_TEST_URL='https://sites.almond.build/blockly-jev/' \
node scripts/test-bit-browser.mjs
```

The acceptance cases are the exact reported statement in Hello, world,
`Instuctions can contain more instructions` (Yes); a false statement about print
(No); an unrelated moon question (neutral); the explainer first in the lesson;
the compact input/send panel without helper text or sound controls; alpha-only
shape; Escape/focus return; desktop 1280×900 and mobile 390×844 without overflow.

The original widget release also passed actual exercise failure and solution-pass
checks on Functions, original voice playback, and Enter/Escape keyboard behavior.
The checker emits its real boolean verdict once; network errors do not produce No.
New requests have a 25-second UI timeout; late/stale results cannot replace a newer
request or another lesson. Empty input stays focused without a browser validation
popup. The shape toggles the panel; no separate close control is needed.

Screenshots are local review evidence under `demo/bit/.impeccable/review/` and are
ignored by Git. Publication receipts and credentials are outside the repository.

## Published result

Release `bit-widget-v6` passed the cases above and is live at
https://sites.almond.build/blockly-jev/#hello. The final visual review returned
Ship with no material fixes. Fastloop verified the public bundle and full-width
layout after activation. `demo/bit/DEPLOYMENT.json` records the immutable revision.
