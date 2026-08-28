# Vinyl Now Playing Design Specification

Status: Proposed

Source reference: Navic `fork/master` at `75ff29669e2b8fc1efb3a09c869d4ae6fb03f270`

## Summary

Add an opt-in vinyl presentation for Feishin's fullscreen artwork on desktop and mobile. The implementation mirrors Navic's record template, timing, readiness rules, and pause behavior while preserving Feishin's existing artwork crossfade, metadata layout, LidaClips foreground player, and ambient clip background.

The feature is a presentation of the current song's artwork, not a new playback engine. Audio state remains authoritative. LidaClips remains an independent foreground or ambient video surface.

## Goals

- Render the current cover as a circular vinyl record using Navic's overlay geometry.
- Rotate only while the current song is actively playing.
- Support the desktop and mobile fullscreen players through one shared policy and visual component.
- Prevent previous-song artwork from flashing during song changes.
- Reset the record to zero degrees when paused or inactive.
- Optionally shrink the record while paused or inactive.
- Preserve all current LidaClips foreground, ambient background, and fallback behavior.
- Respect reduced-motion preferences without removing the vinyl appearance.

## Non-goals

- No change to MPV, Web Audio, queue progression, or media-session behavior.
- No turntable tonearm, needle, platter, or additional transport controls.
- No generated artwork system in the first implementation. Missing or failed covers continue to use Feishin's album placeholder.
- No change to ordinary album cards, playerbar thumbnails, or non-fullscreen artwork.
- No coupling between vinyl mode and the CLIPS tab.

## Selected Approach

Use a shared React `VinylArtwork` component backed by a pure TypeScript policy module and a scalable SVG overlay.

This approach preserves Navic's geometry at every artwork size, lets desktop and mobile use the same behavior, keeps animation on the compositor, and provides deterministic unit-test boundaries. CSS-only pseudo-elements would be harder to validate and theme. A bitmap overlay would not scale cleanly and would duplicate a visual asset that Navic already generates from geometry.

## Settings

Add two persisted fullscreen-player settings:

| Setting | Default | Behavior |
| --- | --- | --- |
| `vinylArtworkEnabled` | `false` | Enables the vinyl presentation in desktop and mobile fullscreen players. |
| `shrinkVinylArtworkOnPause` | `true` | Adds the existing Navic-equivalent inactive padding while paused or when the displayed song is not active. |

Expose both settings in General > Fullscreen Player and in the fullscreen quick-settings popover. Disabling vinyl restores the existing Feishin artwork presentation immediately.

Unlike Navic, Feishin must not infer vinyl mode merely from a wide landscape viewport. Feishin's desktop fullscreen layout is normally wide, so that rule would make a nominally disabled feature appear enabled. Once `vinylArtworkEnabled` is true, desktop and mobile share the same policy.

## Policy Contract

Create a pure module, `src/shared/utils/vinyl-artwork.ts`, with constants and decisions that can be tested without React:

| Constant | Value |
| --- | --- |
| Rotation duration | `8000 ms` |
| Artwork reveal duration | `180 ms` |
| Spindle radius | `0.025 * record radius` |
| Label radius | `0.17 * record radius` |
| Groove start radius | `0.24 * record radius` |
| Groove end radius | `0.95 * record radius` |
| Groove count | `48` |

The policy must answer:

- whether the exact requested artwork is ready;
- whether vinyl presentation is enabled;
- whether rotation is active;
- whether paused/inactive shrink is active;
- which rotation angle corresponds to elapsed animation time;
- whether the overlay is visible.

Rotation requires all of the following:

- `vinylArtworkEnabled` is true;
- player status is playing;
- the rendered song is the active queue song;
- the exact song artwork has loaded successfully;
- reduced motion is not requested.

When any condition becomes false, the visible rotation is `0deg`. A later resume begins a fresh 8-second cycle, matching Navic rather than retaining the paused angle.

## Artwork Readiness

Represent an artwork request with the song unique ID, image ID, image URL, server ID, and effective image size. The vinyl surface remains hidden until the loaded image reports success for that exact request.

On a song or request change:

1. Clear the resolved request identity.
2. Reset rotation to zero.
3. Keep the existing Feishin placeholder visible.
4. Load the new artwork.
5. After exact-request success, reveal the vinyl surface over `180 ms`.

A late success or failure from a previous song must be ignored. If the image fails, use the fullscreen album placeholder and do not draw or rotate a record. A later source change is a new request and must be retried.

## Visual Template

The artwork and overlay rotate as one compositor layer. The record is always square and clipped to a circle while vinyl mode is enabled.

Draw the overlay using theme colors and Navic's exact ratios:

1. Dark scrim: radius `0.985`, alpha `0.16`.
2. Outer ring: radius `0.99`, alpha `0.16`, stroke `radius * 0.018`.
3. Forty-eight concentric grooves from radius `0.24` through `0.95`.
4. Normal grooves: alpha `0.13`, stroke `max(radius * 0.0028, 0.65 px)`.
5. Every seventh groove: alpha `0.22`, stroke `max(radius * 0.004, 0.9 px)`.
6. Center label: radius `0.17`, surface alpha `0.22`, outline alpha `0.32`, outline stroke `radius * 0.008`.
7. Spindle: radius `0.025`, surface alpha `0.92`, outline alpha `0.28`, outline stroke `radius * 0.004`.

Use an SVG `viewBox` so the template is resolution independent. Set `pointer-events: none` and `aria-hidden="true"` on the overlay.

## Artwork Fit

- Square and near-square covers use `cover` inside the circular mask.
- Covers with an aspect ratio of at least `1.18` use `contain` plus a soft edge-compression treatment, matching Navic's wide-artwork policy.
- The record boundary never changes size after image load.
- Existing explicit-art blur remains applied to the full rotating layer.

The implementation may defer soft edge compression to a follow-up only if the base vinyl feature preserves `contain` for wide art and has no visible hard rectangular edge inside the circular mask.

## Pause And Inactive State

When `shrinkVinylArtworkOnPause` is enabled, paused or inactive artwork receives an additional `32 px` inset, animated with the existing UI motion conventions. The surrounding artwork container keeps stable dimensions so metadata does not move.

When the setting is disabled, pause only stops and resets rotation. It does not resize the artwork.

## LidaClips Interaction

- Ambient background clips remain behind the fullscreen overlay and continue independently.
- Opening or playing the foreground CLIPS tab does not disable vinyl mode.
- The left-side artwork may continue rotating while a foreground clip is playing only when Feishin audio is actually playing. Because foreground clip playback pauses Feishin audio, the record will normally be static.
- Sticky clip-mode queue advancement must not read or mutate vinyl state.
- Switching tabs must not mount, unmount, restart, or seek the vinyl component.

## Reduced Motion

When `prefers-reduced-motion: reduce` is active, retain the circular record and overlay but disable rotation and animated shrink/reveal. State changes apply immediately. The user's vinyl setting remains persisted and takes effect normally if reduced motion is later disabled.

## Component Integration

Add:

- `src/shared/utils/vinyl-artwork.ts`
- `src/renderer/features/player/components/vinyl-artwork.tsx`
- `src/renderer/features/player/components/vinyl-artwork.module.css`

Update:

- `full-screen-player-image.tsx`
- `mobile-fullscreen-player-album-art.tsx`
- fullscreen-player store schema and defaults
- General fullscreen settings
- fullscreen quick-settings popover
- i18n source strings and generated locale keys

The existing two-image crossfade remains responsible for song transitions. `VinylArtwork` wraps only the currently visible, successfully loaded image. It must not create a second image request.

## Test Plan

### Unit Tests

- Vinyl defaults to disabled.
- Rotation requires enabled, playing, active, exact-request-ready artwork.
- Paused, stopped, inactive, missing, failed, or stale artwork returns zero rotation.
- Rotation is `0`, `90`, `180`, and `0` degrees at `0`, `2`, `4`, and `8` seconds.
- Overlay geometry preserves spindle, label, groove-start, and groove-end ordering.
- Wide-cover threshold is `1.18`.
- Reduced motion disables animation while preserving presentation.
- Failed artwork uses the placeholder and a changed source retries.

### Renderer Tests

- Desktop and mobile render the same SVG template.
- Song changes never reveal the previous cover inside the record.
- Pause resets angle and applies optional shrink without moving metadata.
- Resume starts a fresh rotation cycle.
- Explicit-art blur follows the rotating layer.
- CLIPS, LYRICS, UP NEXT, RELATED, and VISUALIZER tab changes do not restart the record.
- Ambient and foreground LidaClips behavior is unchanged.

### Manual Verification

- Square, portrait, and wide artwork on desktop and mobile widths.
- Playing, paused, resumed, stopped, next, previous, and queue restore.
- Missing and intentionally broken cover URLs.
- Foreground clip playback and ambient background clips.
- Reduced-motion Windows setting.
- MPV and web playback engines.

Run the BasicAuth release gates, lint, Windows packaging, artifact validation, and local reinstall before release.

## Acceptance Criteria

- Enabling vinyl produces the same recognizable record template and 8-second behavior as Navic.
- Desktop and mobile do not diverge in timing, geometry, readiness, or pause behavior.
- Disabling vinyl restores the existing Feishin artwork exactly.
- No stale image, broken-image icon, layout shift, audio interruption, clip restart, or tab-switch regression is introduced.
- Animation remains smooth without React state updates on every frame.
