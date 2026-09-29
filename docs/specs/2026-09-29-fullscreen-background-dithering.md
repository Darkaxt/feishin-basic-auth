# Fullscreen background dithering

Authorization: `already_authorized` by the user's request to proceed.

## Requirements

- **R1 - Correct layer:** Reduce visible banding in the dark fullscreen Now Playing background used behind the disc and visualizer when no clip is providing the background.
- **R2 - Preserve appearance:** Keep the existing dark gradient, cover-derived base color, opacity behavior, and theme compatibility. Do not introduce a colorful cover-art gradient.
- **R3 - Preserve media behavior:** Do not change clip/video rendering, playback, visualizer, disc, or fullscreen layout behavior.
- **R4 - Minimal native fix:** Reuse the existing theme noise texture as a final dither layer after the black tint, with no new dependency or rendering subsystem.
- **R5 - Verification:** Add a focused regression check, run affected tests and style validation, commit the verified change, and leave release/deployment for separate authorization.

## Stage 1: Dither the final dark tint

Status: COMPLETE

Acceptance criteria:

- The final fullscreen black tint composites `--theme-background-noise` above its color.
- Existing background and media components are unchanged.
- Focused regression tests and style validation pass.
- The completed change is committed with zero blockers and zero tracked deferrals.

## Reconciliation ledger

| Requirement | Status | Evidence |
| --- | --- | --- |
| R1 | SATISFIED | The final fullscreen dark tint now carries the dither texture. |
| R2 | SATISFIED | Diff review confirms the existing gradient, base color, opacity, and themes are unchanged. |
| R3 | SATISFIED | Only the tint CSS and its focused regression check changed; media components are untouched. |
| R4 | SATISFIED | One CSS declaration reuses `--theme-background-noise`; no dependency or subsystem was added. |
| R5 | SATISFIED | The focused regression suite and style validation pass; the verified files are included in the completion commit. |

Blockers: none.

Tracked deferrals: none.
