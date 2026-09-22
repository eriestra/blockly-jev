# Canvas and explainer validation · 2026-09-21

Scope: canvas JavaScript toggle, docked output, compact controls, and ten
narrated SVG/GSAP lesson explainers. Existing lesson text, challenge checking,
Blockly block shapes, and protected Jev contracts remain in use.

Verified against the hosted private preview:

- All ten MP3s load and play. Durations: hello 55.04 s; variables 56.48;
  if/else 58.40; numbers 63.44; switch 55.84; lists/loops 54.80; counting
  56.00; logic 50.40; functions 53.52; assistant 63.76.
- Seeking every sentence shows exactly its corresponding scene.
- Generated JavaScript opens and closes; zoom in and fit work.
- Deleting a block updates the compact trash button; clicking opens the
  recovery flyout with the deleted blocks.
- Desktop 1440×1000 and mobile 390×844 checked. No document horizontal overflow
  and no SVG text exceeds the stage bounds.
- Reduced motion keeps one meaningful scene visible.
- No application exceptions or failed resource requests in the final preview.

Build and strict demo type check pass. Existing suite: 46 tests pass; the ten
opt-in live validation tests were not run. A default old Node 20.16 environment
cannot run current jsdom dependencies; checks used installed Node 26.8.1.

Audio timing: sentence boundaries are measured against pauses. Word highlighting
uses estimates within pause-anchored English phrases, not sample-accurate forced
alignment. All source words are covered; cue times are monotone, non-overlapping,
and bounded by the measured track duration. No speech speed change or MP4 export.

Additional hosted checks passed: a real Hello-world run printed `Hello, world!`
and `true`; pause/resume, mute, caption toggling, and Escape from the expanded
player work. Production activated at https://sites.almond.build/blockly-jev/.

## Narration playback repair · 2026-09-21

Reproduced through Fastloop on the user's Chrome 152: the MP3 loaded with
readyState 4, volume 1 and muted false, but the media element paused around
0.02 seconds without an application pause call. The playback button still
showed Pause. The exact browser/device cause of that unsolicited pause was
not established. The same MP3 decoded through Web Audio produced a nonzero
output signal and an advancing audio clock on that browser.

The player now decodes each short track once per lesson and plays it through
Web Audio. Context resume happens in the click handler before any asynchronous
loading; captions and animation use the output clock. Pause, seek, mute, replay,
and disposal preserve a single source, and a cancelled load cannot start a
previous lesson. Audio interruptions also update the playback button.

Strict demo type checking and the production build pass. All 50 automated
tests pass; ten opt-in Jev live tests remain skipped. Four new regression tests
cover clock/seek behavior, mute/end/replay, cancellation, and download retry.

Hosted preview acceptance through Fastloop: all ten lessons produced measured
nonzero output (peak amplitude above 0.56 in the opening speech), advanced past
two seconds, and passed pause, seek-to-12-seconds, resume and mute/unmute checks.
No runtime exceptions. This checks the decoded output signal as well as the
clock; the earlier media-element-only checks did not establish audible output.
