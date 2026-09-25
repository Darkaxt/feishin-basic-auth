# Fullscreen controls auto-hide

## Authority

The user's request to reduce OLED burn-in by hiding Feishin's player and top bar after inactivity in F11 fullscreen is the authoritative specification.

Implementation authorization: `already_authorized`.

## Required behavior

- **R1 — Scope:** Auto-hide applies only while the whole Feishin document is fullscreen. Ordinary windowed mode is unchanged, and visualizer-only fullscreen remains isolated.
- **R2 — Idle interval:** The window bar and bottom player bar remain visible on fullscreen entry, then hide after 3 seconds without user activity.
- **R3 — Activity recovery:** Pointer movement, pointer press, wheel, touch, or keyboard input reveals both bars immediately and restarts the 3-second interval.
- **R4 — Exit recovery:** Leaving fullscreen immediately restores both bars and cancels pending hiding.
- **R5 — OLED presentation:** Hidden controls fade and slide away, their grid rows collapse so no static empty bands remain, pointer interaction is disabled, and the cursor hides. Reduced-motion preference removes the animation.
- **R6 — Playback isolation:** The feature must not change playback, queue, MPV, LidaClips, or startup behavior.

## Stages

### Stage 1: Regression contract

Status: COMPLETE

Acceptance criteria:

- Focused regression checks cover R1 through R5 and fail because the behavior is absent.

### Stage 2: Integrated auto-hide

Status: COMPLETE

Acceptance criteria:

- A single renderer hook owns fullscreen/activity lifecycle and cleanup.
- Default layout applies the hidden state to both bars without playback changes.
- Focused regression checks pass.

### Stage 3: Final verification and commit

Status: COMPLETE

Acceptance criteria:

- Type checks, lint, focused UI/playback regressions, and production renderer build pass.
- R1 through R6 reconcile with zero blockers and zero tracked deferrals.
- The verified result is committed.

### Stage 4: Local Windows deployment

Status: ACTIVE

This stage was authorized by the user's subsequent request to deploy the feature locally.

Acceptance criteria:

- Build a uniquely versioned Windows x64 NSIS installer containing the committed auto-hide feature.
- Replace the local Feishin BasicAuth installation without replacing or resetting its user profile.
- Verify the installed executable reports the new version and its packaged renderer contains the auto-hide implementation.
- Relaunch the installed application successfully with the existing profile.
- Remove task-owned packaging output after deployment.
- Do not use Docker or publish a GitHub release.

## Reconciliation ledger

| Requirement | Stage | Status | Evidence |
| --- | --- | --- | --- |
| R1 | Stage 2 | COMPLETE | The hook requires `document.fullscreenElement === document.documentElement`; the focused regression passes. |
| R2 | Stage 2 | COMPLETE | Fullscreen entry reveals the bars and schedules the shared 3-second idle interval. |
| R3 | Stage 2 | COMPLETE | Keyboard, pointer, touch, and wheel activity reveal both bars and restart the interval. |
| R4 | Stage 2 | COMPLETE | `fullscreenchange` restores the bars and leaves no timer scheduled after fullscreen exit. |
| R5 | Stage 2 | COMPLETE | The layout collapses both control rows, fades and slides the bars, disables their pointer interaction, hides the cursor, and honors reduced motion. |
| R6 | Stage 3 | COMPLETE | The non-Docker source gate passed playback recovery, MPV recovery, LidaClips, visualizer, type checks, lint, and secret checks; the production Electron build also passed. |

Blockers: 0.

Tracked deferrals: 0.

## Final verification

- `node scripts/run-basic-auth-release-gates.mjs`: passed.
- `corepack pnpm run build:electron`: passed.
- Production bundle inspection: the compiled renderer contains the auto-hide CSS and fullscreen activity lifecycle.
- Generated-output cleanup: the attributed `out` directory was removed after verification; 51,386,908 bytes reclaimed.
- Local installed application: Stage 4 ACTIVE; deployment evidence pending.
