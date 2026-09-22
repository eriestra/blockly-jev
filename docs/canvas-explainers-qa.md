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
