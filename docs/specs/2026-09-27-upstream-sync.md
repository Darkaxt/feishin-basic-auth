# Upstream sync, 2026-09-27

Authorization: `already_authorized` by the user's request to change the maintenance scope and "go ahead".

## Requirements

- **R1 - Integrate current parent:** Merge `upstream/development` at `6c5173f1cf3c2b946c6cf7997428a873e2bf3d7a` (85 commits missing from `origin/development`) into the fork's `development` branch without rewriting history.
- **R2 - Preserve fork behavior:** Preserve proxy BasicAuth and product/updater identity; MPV hydration, queue synchronization, unexpected-exit recovery, and paused resume; LidaClips lookup, ambient/foreground handoff, and playback isolation; fullscreen panels, artwork, auto-hide geometry, and metadata deduplication; lyrics translation/export; visualizer recovery; vinyl artwork; and genre playback.
- **R3 - Integrate upstream behavior:** Retain applicable upstream fixes, especially MPV resume reload, transcode fallback, player crash prevention, seek/crossfade fixes, lyrics refresh/delay, fullscreen overlay/aspect corrections, visualizer stereo capture, and Quick Connect authentication.
- **R4 - Verify:** Run focused conflict-area regressions, the complete non-Docker BasicAuth release gate, and a production Electron build. Add or adjust focused regression coverage only where conflict resolution changes an existing contract.
- **R5 - Deliver source only:** Update the sync record, commit the verified integration, and push `development` to `origin`. Do not use Docker, publish a release, create release artifacts, or replace the installed application.
- **R6 - Track parent PRs:** Record relevant unmerged parent PRs without integrating them automatically.

## Stages

### Stage 1: Controlled integration

Status: COMPLETE

Acceptance criteria:

- Upstream commit `6c5173f1` is in `development` ancestry.
- Every merge conflict is resolved from the current fork and upstream behavior, with R2 and R3 preserved.
- No unrelated refactor or speculative feature is introduced.

### Stage 2: Verification and remediation

Status: COMPLETE

Acceptance criteria:

- Focused conflict-area regressions pass.
- The non-Docker release gate passes.
- The production Electron build passes.
- All R2 and R3 behaviors touched by the merge are reconciled with zero blockers and zero tracked deferrals.

### Stage 3: Documentation and source delivery

Status: ACTIVE

Acceptance criteria:

- R1 through R6 are reconciled with evidence.
- Generated build output is transactionally removed.
- The completed sync is committed and pushed to `origin/development`.
- No release or local deployment occurs.

## Reconciliation ledger

| Requirement | Stage | Status | Evidence |
| --- | --- | --- | --- |
| R1 | 1 | SATISFIED | Merge commit incorporates upstream `6c5173f1` without rewriting fork history. |
| R2 | 1, 2 | SATISFIED | Fork conflicts reconciled; focused regressions and the complete non-Docker gate pass. |
| R3 | 1, 2 | SATISFIED | Upstream conflict behavior integrated; type checks, lint, and production Electron build pass. |
| R4 | 2 | SATISFIED | Non-Docker release gate and `pnpm run build:electron` both exit successfully. |
| R5 | 3 | PENDING | Awaiting verified commit and push. |
| R6 | 3 | SATISFIED | Relevant open parent PRs are recorded below without automatic integration. |

## Verification evidence

- Merge commit `05c607317d2721b637683cacc325079a2e93bfb5` has upstream `6c5173f1` as its second parent.
- `node scripts/run-basic-auth-release-gates.mjs`: exit 0; all focused regressions, dependency checks, node/web type checks, code/style lint, and the BasicAuth secret scan pass.
- `pnpm run build:electron`: exit 0; the main, preload, and renderer production bundles compile successfully.
- Transactional cleanup removed the exact generated `out` tree: 324 attributed entries and 52,311,445 bytes, with no exclusions or residual files.
- Docker, Electron packaging, release publication, and installed-application deployment were not run.

## Unmerged parent PR tracking

- `#2543` simple API-key authentication (draft): authentication overlap; reassess after merge.
- `#2529` fullscreen title-scroll reset: fullscreen overlap; reassess after merge.
- `#2518` visualizer cleanup on resume: visualizer/recovery overlap; reassess after merge.
- `#2506` mini player: player UI expansion; track without pre-merging.
- `#2505` Up Next queue: queue UI overlap; track without pre-merging.
- `#2492` sidebar Now Playing: queue/sidebar overlap; track without pre-merging.
- `#2484` custom headers (draft): proxy/auth header overlap; reassess after merge.
- `#1678` SSO proxy authentication: conflicts with current parent and overlaps BasicAuth; do not integrate in its current state.

Blockers: none.

Tracked deferrals: none.
