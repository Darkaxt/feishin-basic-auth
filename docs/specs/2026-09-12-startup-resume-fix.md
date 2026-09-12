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

## Current blockers and tracked deferrals

- Blockers: none.
- Tracked deferrals: none.
