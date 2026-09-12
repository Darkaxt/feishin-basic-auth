# Cold-start Resume playback fix

Authorization: already_authorized by the user's request to fix the reported Resume failure.

## Problem

After opening the packaged Windows app, Feishin restores and displays the prior track and position. Activating Resume changes the player presentation as though playback continued, but the selected track does not actually continue playing.

The supplied screenshot shows `Good 4 U` by Eklipse restored at 0:34 / 2:59 with the player bar presenting a pause control. That visual state is symptom evidence only; it does not prove MPV received or executed the required cold-start commands.

## Requirements

- R1: A cold launch with a valid saved queue, current item, and nonzero position must allow the user to activate Resume and audibly continue that same item from the restored position.
- R2: The renderer's visible playing or paused state must agree with the actual player lifecycle. It must not present successful playback merely because a command was requested before the player could execute it.
- R3: Resume restoration must use deterministic player readiness and lifecycle events. Do not add sleeps, arbitrary retries, or timeout-driven synchronization.
- R4: Preserve proxy BasicAuth, profile identity, MPV startup and shutdown, queue restoration, seeking, remote controls, LidaClips, visualizer, and vinyl behavior.
- R5: Determine whether the current 29-commit parent delta contains the relevant fix before choosing a fork-local change or a bounded upstream integration.
- R6: Add focused regression coverage that fails on the current behavior and passes after the root-cause fix.
- R7: Verify the narrow real startup Resume workflow where the available environment permits, run the applicable repository gates, and commit the verified result. Do not release or publish without separate authorization.
- R8: Publish the verified fix as Windows prerelease `v1.15.1-ba.17` from the exact committed `development` source.
- R9: Preserve the established x64, arm64, architecture-neutral installer, ZIP, blockmap, and `latest.yml` release asset contract.
- R10: Independently download and verify the published x64 installer, including its GitHub digest, packaged application version, product identity, and signing status relative to the previous release.
- R11: Install the verified x64 release in place without replacing the existing BasicAuth user-data profile, then verify the installed version and the real cold-start Resume workflow.

## Staged plan and reconciliation

### Stage 1: Reproduce and isolate

Status: COMPLETE

Requirements: R1, R2, R3, R5

Acceptance criteria:

- Trace saved queue and position restoration into the Resume UI action.
- Trace the action through renderer status, MPV readiness, seek, and play command dispatch.
- Reproduce the defect with runtime evidence or a deterministic focused test.
- State one evidence-backed root-cause hypothesis and determine whether parent development already resolves it.

Verification evidence required: source trace, relevant history comparison, and a repeatable failing observation or test.

Evidence: the persisted player store hydrates asynchronously, while MPV previously initialized and synchronized its queue immediately. The focused hydration regression initialized MPV while hydration was false and failed before the production change. Parent `development` at `42fa55a8e` retains the same startup ordering.

### Stage 2: Implement the minimal fix

Status: COMPLETE

Requirements: R1, R2, R3, R4, R6

Acceptance criteria:

- A focused regression test fails for the established reason before production code changes.
- The smallest root-cause fix makes that test pass.
- Focused adjacent MPV, queue restore, seek, and fork playback regressions pass.

Verification evidence required: recorded red and green test results plus a reviewed focused diff.

Evidence: MPV initialization now waits for `usePlayerHydrated()` without a timeout or retry. The focused regression passed after the change, as did adjacent queue synchronization, playback restoration, MPV lifecycle, and default-player tests.

### Stage 3: Integrated verification and commit

Status: COMPLETE

Requirements: R1, R2, R4, R7

Acceptance criteria:

- The real available startup Resume workflow continues the restored track and position without false player state.
- Applicable typecheck, lint, style, security, and regression gates pass freshly.
- Full specification reconciliation has zero blockers and zero tracked deferrals.
- Verified changes are committed according to repository conventions.

Verification evidence required: real workflow evidence, final gate output, clean diff review, and final commit identity.

Evidence: a source build opened against an exact copy of the closed production profile with `Good 4 U` restored at 0:34. Activating Resume changed the player control to playing, MPV reached 34.50 seconds and then 45.45 seconds, and the renderer advanced to 0:44. The non-packaging repository gate, Electron build, task-scoped cleanup, and conventional commit passed.

### Stage 4: Publish and deploy the verified Windows release

Status: COMPLETE

Requirements: R8, R9, R10, R11

Acceptance criteria:

- The release metadata is updated to `1.15.1-ba.17` and committed on `development`.
- The Windows release gate passes except for the Docker-backed BasicAuth smoke test, which the user explicitly waived after Docker Desktop repeatedly crashed before Compose could start; the exact release commit is pushed and tagged.
- GitHub publishes prerelease `v1.15.1-ba.17` with the established complete asset set.
- A fresh download of the x64 installer matches GitHub's SHA-256 digest and contains Feishin `1.15.1-ba.17` with the expected signing status.
- The verified installer upgrades the existing local installation while leaving `C:\Users\darka\AppData\Roaming\Feishin BasicAuth` in place.
- The installed application reports `1.15.1-ba.17`, launches successfully, and Resume advances the restored track from its saved position.
- Release build and verification artifacts are transactionally cleaned after deployment evidence is retained.

Verification evidence required: release gate output with the explicit Docker-smoke waiver recorded, commit and tag identity, GitHub release metadata, independent artifact checksum and package inspection, installed executable metadata, real playback progression, and cleanup status.

Evidence: release commit `cd5b5ad7e67b8bfc36554e4d1dfa73ecc41105fa` was pushed to `development` and tagged `v1.15.1-ba.17`. The non-Docker release gates, Windows packaging checks, CodeQL run `34725196551`, and the nine-asset prerelease contract passed; the fork's active generic Test workflow emitted no run. A fresh GitHub download of the x64 installer matched published SHA-256 `c1fbd842fc8ddce6edebac6c5c005d1a8733adc2530c71353cd2d61cc57573b1`. The downloaded installer and ZIP payload both reported Feishin `1.15.1-ba.17` and the expected `NotSigned` status. The installer upgraded `C:\Users\darka\AppData\Local\Programs\Feishin BasicAuth\Feishin.exe` from `1.15.1-ba.16` with exit code 0 while the 507-file BasicAuth profile, total byte count, `config.json` hash, and Chromium Preferences hash remained unchanged before first launch. The installed app restored `Good 4 U` paused at 0:34; the verification action explicitly clicked Resume, after which the UI reached 0:43 and MPV reported 43.84 seconds while running. The verification then returned playback to paused. Transactional cleanup removed the two unpacked build trees plus all remaining `out`, `dist`, and `D:\Temp\feishin-ba17-release` artifacts with zero warnings or residual helper files.

## Current blockers and tracked deferrals

- Blockers: none.
- Tracked deferrals: none.
