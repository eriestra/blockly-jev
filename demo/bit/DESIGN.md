---
name: Bit — Live 3D
description: A sparse, dark TRON-inspired interface centered on a live geometric artifact.
colors:
  background: "#080b10"
  ink: "#eff5fc"
  muted: "#9aafc4"
  line: "#273849"
  yes: "#ffd24c"
  no: "#ff7964"
  yes-wash: "#ffd24c12"
  no-wash: "#ff796412"
  mesh-neutral: "#a9d7f3"
  mesh-yes: "#ffb800"
  mesh-no: "#ff341b"
  widget-paper: "#fbf9f5"
  widget-ink: "#29231e"
  widget-violet: "#7557c7"
  widget-placeholder: "#766b61"
  widget-selection: "#e3d9f8"
  widget-yes: "#236445"
  widget-no: "#a13022"
  widget-button-ink: "#ffffff"
  widget-scrollbar: "#b7aca0"
typography:
  title:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "0.12em"
  button:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
  status:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "13px"
  footer:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "12px"
    lineHeight: 1.8
  widget-body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    lineHeight: 1.5
  widget-field:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "16px"
    lineHeight: "24px"
  widget-answer:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "13px"
    lineHeight: 1.5
rounded:
  widget-panel: "12px"
  widget-field: "6px"
  widget-action: "8px"
  widget-shape: "16px"
  control: "4px"
spacing:
  compact: "12px"
  control-gap: "16px"
  mobile-gutter: "18px"
  mobile-control-offset: "20px"
  mobile-header-offset: "22px"
  standard: "24px"
  section: "28px"
  desktop-block: "36px"
components:
  widget-panel:
    backgroundColor: "{colors.widget-paper}"
    textColor: "{colors.widget-ink}"
    rounded: "{rounded.widget-panel}"
    typography: "{typography.widget-body}"
    padding: "10px"
  widget-input:
    backgroundColor: "transparent"
    textColor: "{colors.widget-ink}"
    rounded: "{rounded.widget-field}"
    typography: "{typography.widget-field}"
    padding: "10px 8px"
  widget-ask:
    backgroundColor: "{colors.widget-violet}"
    textColor: "{colors.widget-button-ink}"
    rounded: "{rounded.widget-action}"
    width: "44px"
    height: "44px"
  button-yes:
    backgroundColor: "transparent"
    textColor: "{colors.yes}"
    rounded: "{rounded.control}"
    typography: "{typography.button}"
  button-no:
    backgroundColor: "transparent"
    textColor: "{colors.no}"
    rounded: "{rounded.control}"
    typography: "{typography.button}"
  button-yes-hover:
    backgroundColor: "{colors.yes-wash}"
    textColor: "{colors.yes}"
  button-no-hover:
    backgroundColor: "{colors.no-wash}"
    textColor: "{colors.no}"
---

# Design System: Bit — Live 3D

## Overview

**Creative North Star: "TRON Bit"**

The approved TRON reference owns the visual world. A luminous, faceted artifact occupies generous dark space; compact controls and quiet text support it. Preserve this existing direction when extending the player.

The embedded lesson widget is an intentional second surface: the same geometric artifact floats without a background or halo, while its question panel adopts the host’s paper, violet, typography, and rounded controls. Full-page tokens remain authoritative for the standalone player; widget-prefixed tokens apply only to the embedded panel.

**Key Characteristics:**
- Dark, sparse composition.
- Clean planar geometry with reflective materials.
- Equal Yes and No controls with restrained color.
- Host-matched paper and violet for the embedded question panel.

## Colors

The background, ink, muted text, and fine line tokens define the interface. Yellow signals Yes; coral signals No. Their translucent washes appear on hover and while pressed. The mesh uses its own pale blue, gold, and red tokens for stronger material response under scene lighting.

The widget panel uses warm paper and ink with violet action and focus treatments. Its answer text uses green for Yes and red for No; the 3D response retains the shared gold/red mesh palette.

## Typography

Use the locally available sans-serif stack throughout. The small, tracked BIT title and response labels share a size and weight; status and footer text recede. Keep text concise so the artifact retains visual priority.

The widget uses its host-aligned Inter/system stack: a 16px input with 24px line height and a 13px live answer with 1.5 line height. The arrow send action uses an icon and an accessible name.

## Layout

Center one column with a maximum width of 780px inside a viewport-height page. Desktop page padding is 36px vertically and 24px horizontally. The stage height is `clamp(310px, 50vh, 490px)`. Header separation is 28px; two equal control columns use a 16px gap and 24px top margin. Controls have a minimum height of 76px; the footer begins 28px below them.

At widths up to 520px, use 24px vertical and 18px horizontal page padding, a 340px stage, 22px header separation, 12px control gap, 20px control top margin, and 68px minimum control height. Preserve the two-column control arrangement. Resize the renderer and camera to the stage and cap pixel ratio at 2.

The fixed widget is 124px square, anchored at `right: max(12px, env(safe-area-inset-right))` and `bottom: max(8px, env(safe-area-inset-bottom))`, with z-index 90. At widths up to 600px it becomes 100px square. Its panel sits 122px above the widget bottom (102px on mobile), inset 4px from the right; width is `min(340px, calc(100vw - 32px))`. Panel padding is 10px; `max-height: calc(100dvh - 155px)` and scrolling keep it accessible in short viewports. The input and fixed-size send button share a single flex row with an 8px gap. Answers add space only when present, with an 8px top/side and 2px bottom margin. Only the shape and panel receive pointer events.

## Elevation & Depth

The full-page interface has no elevated cards or box shadows. Depth comes from the 3D object: flat shading, metalness 0.65, roughness 0.27, clearcoat 1, and clearcoat roughness 0.16. Cool hemisphere, key, and rim lighting work with a room environment and ACES filmic tone mapping at exposure 0.9. A diffuse blue ground glow anchors the floating object.

The widget removes the ground glow entirely and renders with alpha transparency. Its question panel alone uses `0 12px 36px #17130f2e` elevation to separate it from the host lesson.

## Shapes

Preserve angular silhouettes and planar facets. Four absolute radial mesh targets share 192 triangles; their topology follows the destination face boundaries. Neutral alternates between a shallow stellated solid and an icosahedron. Yes resolves to an octahedron; No resolves to a stellated form. Controls have subtly softened corners, fine borders, and small outline icons.

The widget panel has 12px corners, its transparent borderless input has 6px corners, and its arrow send button has 8px corners. The transparent artifact hit area retains 16px corners. These host-aligned shapes apply only to the widget.

## Components

The live canvas is the primary component. Its neutral morph cycle is approximately 1.75 seconds, with slow rotation and light vertical drift. A response morph takes 0.30 seconds; return begins after a 1.45-second activation timer and lasts 0.62 seconds. Morphs use quintic smoothstep. Reduced motion removes idle movement and uses 0.16-second transitions.

Yes and No buttons share equal prominence. Hover and pressed states add a faint color wash and an accent border. Pressing translates the control down 1px. Focus uses a 2px ink outline offset by 5px. Disabled controls have 0.35 opacity. Button transitions last 0.15 seconds and are disabled under reduced motion. The status label and dot follow the current response; the footer supplies keyboard guidance and the original source link.

The embedded artifact button opens the panel, focuses the input, and exposes its expanded state. Toggling the artifact or pressing Escape closes the panel and restores artifact focus. The panel contains only a 400-character input with an accessible label, a 44px square arrow send button, and live answer/status text when present. It omits a title, topic/helper text, visible label, sound toggle, and close button. The input has a transparent background, no border, and 10px vertical / 8px horizontal padding. Focus uses a 2px violet outline offset by 2px.

While awaiting Jev, the send button is disabled at 0.6 opacity with accessible name “Thinking”; the live status reads “Thinking…”. A response or failure restores “Ask Bit”. Empty input returns focus to the field. Two parallel Jev judgments check eligibility and the answer. Eligibility below 0.65 stays neutral; eligible input shows Yes at answer probability ≥0.60, No at ≤0.40, and unknown between them. The shared request timeout is 25 seconds. Widget responses begin returning after 1.70 seconds; response and return morph durations match the full-page player. Opening/submitting the panel or checking an exercise unlocks the original recorded response audio.

## Do's and Don'ts

- Do keep the live artifact visually dominant.
- Do preserve clean planar facets and equal response controls.
- Do retain keyboard, focus, status, and reduced-motion behavior.
- Do keep the embedded artifact transparent and its panel aligned with the host.
- Don't introduce a new brand or decorative dashboard furniture.
- Don't apply the widget panel palette, radius, or typography to the standalone player.
- Don't restore video playback or a scrubber as the primary interaction.
