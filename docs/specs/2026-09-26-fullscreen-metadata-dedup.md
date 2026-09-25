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

Status: COMPLETE

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
| R1 | 1 | SATISFIED | The regression initially retained duplicate `release_year`/`year` values, then passed after identical formatted date-family values were filtered. |
| R2 | 1 | SATISFIED | `dedupeFullscreenDateMetadataItems` walks the configured item order and retains the first enabled matching value. |
| R3 | 1 | SATISFIED | Focused coverage preserves distinct `2023-09-15` and `2023` values and leaves non-date metadata unchanged. |
| R4 | 1 | SATISFIED | The non-Docker release gate, node/web type checks, ESLint, stylelint, secret scan, and production Electron build passed. Playback code was not changed. |
| R5 | 1 | SATISFIED | `1.15.1-ba.22` was installed from the Windows x64 NSIS installer; the installed `app.asar` contains the helper and deduplicated render path, and the existing profile reopened paused on `The Summit` with MPV running. Generated output was transactionally removed. |

Blockers: none.

Tracked deferrals: none.

## Delivery evidence

- Source commit: `3559b967` (`fix(ui): deduplicate fullscreen date metadata`).
- Installer: `Feishin-1.15.1-ba.22-win-x64.exe`, 176,536,952 bytes, SHA-256 `8C363BBA6B63D27B2951D0410D8AA979220358107D5098220BF8383D652B4CC7`.
- Installed executable SHA-256: `D2288C75B414176B6AA261C09147DA90D0A5472D1800A45B88FC04B3EDE8CBC9`.
- Installed payload version: `1.15.1-ba.22`; its source maps contain both the seen-value filter and the `deduplicatedPlayerItems` render path.
- The persistent `Preferences` hash remained `F3D1ACE92E5AE17EE09BD9FB1D42165D44ABEE7095A694843457F15FBBDCC018`. Volatile profile counts and `config.json` changed during the application's normal shutdown and are not represented as installer-preservation evidence.
- Relaunch evidence: responsive main window titled `(Paused) (30 / 100) The Summit — Taylor Davis — Feishin`; MPV child process present. No Play/autoplay action was issued.
- Cleanup transaction `4f2eb295ad45848faf8dd9da51400228` deleted all 443 reviewed outputs (868,212,986 bytes) with no warnings or errors.
- Docker was not used and no public release was created.
