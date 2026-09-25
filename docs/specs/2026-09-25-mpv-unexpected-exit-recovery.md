# MPV unexpected-exit recovery

## Authority

The live Feishin failure observed on 2026-09-25 and the user's instruction to fix both MPV termination and missing recovery are the authoritative specification.

Implementation authorization: `already_authorized`.

## Required behavior

- **R1 — Exception isolation:** A non-broken-pipe uncaught exception in the Electron main process must be logged without terminating an otherwise healthy MPV child process.
- **R2 — Diagnostic fidelity:** Logged JavaScript `Error` values must retain their name, message, stack, and cause while existing secret redaction remains effective.
- **R3 — Exit classification:** Feishin must distinguish intentional MPV shutdown/reload from an unexpected MPV child-process exit.
- **R4 — Automatic recovery:** An unexpected MPV exit must be logged with its exit code and signal and must request renderer-side MPV reinitialization.
- **R5 — Playback continuity:** Automatic recovery must restore the same current song at the renderer's latest known playback position and preserve its playing or paused state.
- **R6 — Scope preservation:** Startup must not autoplay, LidaClips audio ownership must remain unchanged, and intentional MPV shutdown must not trigger recovery.

## Stages

### Stage 1: Regression contract and failure proof

Status: COMPLETE

Acceptance criteria:

- Focused regressions reproduce the exception-driven MPV teardown, missing Error details, missing unexpected-exit recovery signal, and missing recovery position.
- The regressions fail for the expected missing behaviors before production code changes.

### Stage 2: Minimal integrated recovery

Status: COMPLETE

Acceptance criteria:

- R1 through R6 are implemented without timeouts, retries, generalized process infrastructure, or unrelated playback changes.
- Focused regressions pass.

### Stage 3: Final verification and commit

Status: COMPLETE

Acceptance criteria:

- Applicable TypeScript, lint, focused playback, startup-resume, LidaClips, and production build verification pass.
- The implementation is reconciled against R1 through R6 with zero blockers and zero tracked deferrals.
- The verified result is committed.

### Stage 4: Local Windows deployment

Status: COMPLETE

This stage was authorized by the user's subsequent request to deploy the fix locally.

Acceptance criteria:

- Build a uniquely versioned Windows x64 NSIS installer containing the committed recovery fix.
- Replace the local Feishin BasicAuth installation without replacing or resetting its user profile.
- Verify the installed executable reports the new version and contains the recovery implementation.
- Relaunch the installed application successfully with the existing profile.
- Remove task-owned packaging output after deployment.
- Do not use Docker or publish a GitHub release.

## Reconciliation ledger

| Requirement | Stage | Status | Evidence |
| --- | --- | --- | --- |
| R1 | Stage 2 | COMPLETE | The player-level uncaught-exception teardown was removed; the main handler logs without MPV cleanup. |
| R2 | Stage 2 | COMPLETE | Error name, message, stack, cause, and custom fields are sanitized and retained. |
| R3 | Stage 2 | COMPLETE | Intentional child exits are marked and stale generations are ignored. |
| R4 | Stage 2 | COMPLETE | Current unexpected exits log code/signal and emit `renderer-mpv-reconnect`. |
| R5 | Stage 2 | COMPLETE | Recovery captures song/timestamp and restores only when the song still matches. |
| R6 | Stage 2/3 | COMPLETE | Playing/paused state is derived from the current player store; startup-resume and LidaClips regression gates passed without behavior changes. |

Blockers: 0.

Tracked deferrals: 0.

## Final verification record

- Focused MPV recovery and diagnostic regressions: passed.
- Complete BasicAuth source release gate, including type checks, lint, startup-resume, LidaClips, playback restore, MPV queue, secret scan, and affected regressions: passed.
- Production Electron build: passed.
- Task-owned `out` build output: transactionally removed after verification (322 items, 51,379,815 bytes).
- Live installed application: unchanged during Stages 1–3; local deployment was subsequently authorized as Stage 4.
- A live ba.19 crash simulation exposed a paused-state race before Stage 4 closure; a new regression failed first, and recovery now snapshots the play/pause state before MPV reinitialization can emit transient events.
- The complete BasicAuth source gate passed after the paused-state correction.
- Windows x64 NSIS installer `Feishin-1.15.1-ba.19-win-x64.exe` was built without Docker or publication: 185,779,543 bytes, SHA-256 `696DAF6B6E8FAE843F0994190FB9D5A7A4AD7217499BE092707B7D3FF9AC2715`, unsigned in line with the existing local-build convention.
- Silent in-place installation exited 0. The installed executable reports `1.15.1-ba.19`, SHA-256 `4BC2DC3DE8B4AE4458CD8C6E9BABD47DCA0F5A385CE56B1CD5505A0B2599FD3C`, and its packaged application contains both the unexpected-exit handler and recovery-state snapshot.
- The existing profile reopened the same queue and track paused. In the final live recovery check, MPV PID `59164` was terminated, replacement PID `57592` was created under the same Feishin process, and steady state restored `pause=true` at the exact pre-crash position `1.472888` seconds while Feishin remained responsive.
- Task-owned `out` and `dist` packaging output was transactionally removed after installation (466 items, 930,910,593 bytes).
