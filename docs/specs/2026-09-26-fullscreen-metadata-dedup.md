# Fullscreen metadata deduplication

## Authority

The user's report that the fullscreen player shows the same `2023` badge twice is the authoritative specification.

Implementation and local-deployment authorization follow the established Feishin bug-fix workflow in this task. Docker and public release publication remain excluded.

## Required behavior

- **R1 — No duplicate date badge:** Enabled fullscreen date metadata fields (`Date`, `Release date`, `Release year`, and `Year`) that format to the same visible value render only once.
- **R2 — Preserve order:** When values duplicate, retain the first enabled field in the user's configured metadata order.
- **R3 — Preserve information:** Distinct formatted date/year values remain visible, and non-date metadata is unchanged.
- **R4 — Scope:** The change affects only fullscreen metadata rendering; playback, queue, MPV, LidaClips, and settings persistence remain unchanged.
- **R5 — Delivery:** Verify, commit, build a uniquely versioned Windows x64 installer, install it locally without resetting the existing profile, and remove task-owned packaging output.

## Stages

### Stage 1: Fullscreen metadata correction and local deployment

Status: ACTIVE

Acceptance criteria:

- A focused regression test fails against the duplicated behavior and passes after the correction.
- Identical date/year display values are deduplicated according to R1 through R3.
- Focused tests, type checks, lint, and the production Electron build pass.
- The corrected uniquely versioned Windows x64 installer is installed locally with the profile preserved.
- The installed payload contains the correction and launches successfully.
- Task-owned packaging output is removed; Docker and public release publication are not used.

## Reconciliation ledger

| Requirement | Stage | Status | Evidence |
| --- | --- | --- | --- |
| R1 | 1 | PENDING | Awaiting red/green regression evidence. |
| R2 | 1 | PENDING | Awaiting red/green regression evidence. |
| R3 | 1 | PENDING | Awaiting red/green regression evidence. |
| R4 | 1 | PENDING | Awaiting focused and integration verification. |
| R5 | 1 | PENDING | Awaiting verified local deployment and cleanup. |

Blockers: none.

Tracked deferrals: none.
