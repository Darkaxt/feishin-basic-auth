# LidaClips foreground handoff

## Authority

The user-reported CLIPS behavior and the clarification from 2026-09-13 are the authoritative specification for this fix.

## Required behavior

1. Selecting the CLIPS tab while an ambient LidaClips video is running must foreground that same video element and retain its current playback position.
2. The foreground clip must expose video controls, become audible, and continue playing.
3. Feishin song audio must pause when the clip takes audio ownership.
4. Leaving clip playback must return the same video to the ambient background, map its current progress back to the song, and resume song audio.
5. The CLIPS tab must not create a second independent video player in ambient background mode.
6. Opening Feishin or restoring persisted UI state must not automatically enable clip playback.
7. Existing LidaClips authentication, lookup, streaming, queue advance, and BasicAuth profile identity must remain unchanged.

## Constraints

- Reuse the existing ambient video element and current player stores.
- Do not add autoplay-on-open behavior.
- Do not add timeouts, sleeps, retries, Docker requirements, new services, or generalized playback infrastructure.
- Do not publish a GitHub release as part of this implementation.

## Stages

### Stage 1: Root cause and regression contract

Status: COMPLETE

Acceptance criteria:

- The tab activation, duplicate player, playback position, and audio ownership failure are traced to their source paths.
- Focused tests fail against the current implementation for foreground activation and same-element presentation.

### Stage 2: Minimal integrated handoff

Status: COMPLETE

Acceptance criteria:

- Explicit CLIPS selection activates clip mode.
- Ambient mode presents one video element across background and foreground states without resetting playback position.
- Audio ownership transfers to the clip on entry and back to the song on exit.
- Focused regression tests pass.

### Stage 3: Verification and commit

Status: COMPLETE

Acceptance criteria:

- Type checking, applicable linting, and focused LidaClips tests pass.
- The integrated UI workflow is verified in a task-owned development profile when practical.
- No autoplay-on-open or unrelated playback behavior is introduced.
- The verified result is committed.

### Stage 4: Local installation

Status: COMPLETE

This stage was authorized by the user's subsequent request to update the local installation.

Acceptance criteria:

- Build a uniquely versioned Windows x64 installer containing the committed fix.
- Replace the installed Feishin BasicAuth application without replacing or resetting its profile.
- Verify the installed executable reports the new version and launches successfully.
- Verify the profile identity and settings files remain unchanged across installation.
- Remove task-owned packaging output after installation.
- Do not publish a GitHub release or use Docker.

## Verification record

- Focused LidaClips and startup-resume regression tests pass.
- Full TypeScript, ESLint, and Stylelint verification passes.
- A fresh production Electron renderer build passes.
- The isolated Electron instance booted from a task-owned profile on `D:\Temp`, but its different file origin could not read the installed app's authenticated state. The installed profile and active playback were not interrupted for this optional UI check.
- The Docker-dependent release smoke test was excluded by explicit user instruction.
- A uniquely versioned Windows x64 NSIS installer was built from commit `43c70c94` and installed silently with exit code 0.
- The installed executable reports file version `1.15.1-ba.18` and SHA-256 `E7C9808DEA9B1A6B56FCA4032F41F1533504992498DD2BD1602EDE28BD4219FD`.
- The profile file count, byte count, `config.json` hash, and Chromium `Preferences` hash were identical immediately before and after installation.
- The installed application relaunched successfully and retained the restored queue in a paused state; no verifier play click or autoplay was used.
- The task-owned `out` and `dist` packaging trees were transactionally removed, reclaiming 868,183,034 bytes.
- No GitHub release was published and Docker was not used.
