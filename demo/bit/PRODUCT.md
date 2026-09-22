# Product
<!-- impeccable:product-schema 1 -->

## Platform
Full-page player, published on Almond: https://sites.almond.build/bit-live/.

Embedded lesson widget: https://sites.almond.build/blockly-jev/#functions.

## Purpose
A personal interactive TRON Bit. Yes and No buttons, or Y/N keys, trigger live 3D responses with the original robotic voice. Bit then returns to a continuously changing neutral form. The approved direction is dark, sparse, and led by the artifact.

## Stack
Canonical source lives in `demo/bit/` within the Blockly/Jev repository. Three.js renders a WebGL canvas. The host imports and mounts the widget with its existing Jev runtime; geometry and audio are bundled from local JSON. The full-page player needs no account or data collection. The lesson widget sends its question and authored lesson prose through two parallel calls using the host’s existing Jev runtime.

## Approved behavior
Live 3D replaces the earlier video player. Four absolute radial mesh targets share 192 triangles: a shallow stellated neutral solid, an icosahedron, a yellow octahedron for Yes, and a red stellated form for No. Shared face boundaries preserve clean planar facets at each destination.

The neutral cycle takes approximately 1.75 seconds. Response morphs take 0.30 seconds; the return starts 1.45 seconds after activation and morphs over 0.62 seconds. A new response interrupts the current response and restarts its timer and audio. Reduced motion freezes idle morphing and movement and uses 0.16-second response transitions.

Original audio comes from the user-supplied [“Tron” Bit Demo](https://www.youtube.com/watch?v=j3geresa7-Y), downloaded with yt-dlp: Yes starts at 1.30 seconds for 0.88 seconds; No starts at 3.03 seconds for 0.55 seconds. These are excerpts of the supplied recording, not synthesized speech.

## Constraints
Preserve the recognizable TRON-inspired geometry and existing visual direction. Support touch, keyboard, visible focus, live response status, reduced motion, and clear WebGL/audio failure feedback. Keep the full-page interface to the artifact and two response controls. The embedded widget adds a compact input-and-send panel for questions or statements, with an answer shown only when present.

## Embedded lesson widget
The additional `bit-widget` surface floats at the host’s bottom-right with a transparent canvas and no background or halo. Clicking the artifact opens a compact paper-and-violet panel containing one accessible input and a 44px arrow send button. There is no title, topic/helper text, visible label, sound toggle, or close button. Clicking the artifact again or pressing Escape closes the panel and returns focus to the artifact. This intentional surface extension preserves the original full-page player and its dark visual system.

The widget accepts yes/no questions and true/false statements, tolerates spelling mistakes, and uses lesson context plus basic programming knowledge needed to interpret its examples, including nested blocks. Each submission makes two parallel `noul` judgments through the host runtime: one for binary-input eligibility and relevance, and one for the probability of an affirmative answer or true statement. Almond uses the existing protected `jev_noul` call for both; local development uses the host’s proxy runtime. Context contains only the current authored lesson heading and direct prose paragraphs, capped at 2,800 characters; learner input is capped at 400 characters. Lesson text is further shortened when necessary to keep the JSON-encoded state within the protected call’s 4,096-character limit. Workspace content, input fields, hidden solutions, and storage are not included in the question context. Eligibility/relevance must be at least 0.65. Eligible input yields Yes when answer probability is at least 0.60, No when it is at most 0.40, and unknown between those bounds. The answer prompt requests a probability near 0.50 when evidence is insufficient. Unknown remains neutral for ineligible or uncertain input. Missing evidence alone does not make a statement false. Pending or failed requests also keep the shape neutral. A shared 25-second timeout covers both judgments and restores the send control and shows retry feedback. Lesson changes and exercise judgments invalidate stale question responses.

The host emits `bit:exercise` with `{ lessonId, passed }`; the widget accepts only the current lesson and an exact boolean, showing and voicing Yes for true or No for false. It uses the existing exercise judgment rather than judging again. `bit:unlock` runs from the exercise-check gesture to unlock Web Audio before the asynchronous result. Opening or submitting the panel also unlocks audio. Original recorded Yes/No clips are shared with the player and play with supported responses; the compact widget has no sound toggle. The widget starts returning to neutral 1.70 seconds after a response; its other morph timings match the player.

## Disposition
Ship the approved narrow live 3D player. Future changes should preserve its original audio, clean facets, fast neutral cycle, and restrained interface.
