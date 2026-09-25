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

Status: COMPLETE

This stage was authorized by the user's subsequent request to deploy the feature locally.

Acceptance criteria:

- Build a uniquely versioned Windows x64 NSIS installer containing the committed auto-hide feature.
- Replace the local Feishin BasicAuth installation without replacing or resetting its user profile.
- Verify the installed executable reports the new version and its packaged renderer contains the auto-hide implementation.
- Relaunch the installed application successfully with the existing profile.
- Remove task-owned packaging output after deployment.
- Do not use Docker or publish a GitHub release.

### Stage 5: Fullscreen surface correction and local redeployment

Status: ACTIVE

The user's live ba.20 verification found that the bars disappeared while the fullscreen player retained its pre-hide fixed height, exposing the underlying page at the bottom.

Acceptance criteria:

- The fullscreen player surface follows the resized `main-content` row and covers the entire released area.
- Windowed and bar-visible layout behavior remains unchanged.
- Focused fullscreen, LidaClips, playback, type, lint, and production build verification pass.
- A uniquely versioned Windows x64 installer is deployed locally with the existing profile preserved.
- The installed application contains the correction and relaunches successfully.
- Task-owned packaging output is removed; Docker and public release publication remain excluded.

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
- Windows x64 NSIS installer `Feishin-1.15.1-ba.20-win-x64.exe` was built without Docker or publication: 176,535,998 bytes, SHA-256 `90434188DDFB1ECE3BB9198A6498421E2130CFBEA05B43FC3475CC0652CC3F04`, unsigned in line with the existing local-build convention.
- The installer payload reported `1.15.1-ba.20` and contained the fullscreen activity lifecycle, collapsed control rows, and hidden cursor presentation.
- Silent in-place installation exited 0. The installed executable reports `1.15.1-ba.20`, SHA-256 `95242033F55BD4FB213F47FBC64BA841DE56B01010900A93AD672292B3296245`, and its installed `app.asar` contains the same auto-hide implementation.
- Before first launch, the existing profile remained exactly 279 files and 212,151,752 bytes; `config.json` retained SHA-256 `52A8EBF49FD0360218A7B0A480744C03A4DDD26C65EA7B8D2DA7CE61DA7371C0` and Chromium `Preferences` retained SHA-256 `F3D1ACE92E5AE17EE09BD9FB1D42165D44ABEE7095A694843457F15FBBDCC018`.
- The installed application relaunched responsive with the existing queue restored paused and a new MPV child process; no Play/autoplay verification action was used.
- Task-owned `out` and `dist` packaging output was transactionally removed after installation (443 items, 868,213,913 bytes).
