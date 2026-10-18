# October 18 upstream maintenance

Authorization: scheduled upstream integration, already authorized. No Docker, release artifacts, publication, deployment, or unmerged parent PR integration.

## Required outcome

- Integrate all 15 upstream development commits from 9dc15477c through 36f8e1839, including Up Next queue behavior and related fixes.
- Preserve BasicAuth and updater identity; MPV queue synchronization, recovery and startup resume; LidaClips foreground/background behavior; fullscreen behavior; all verified fork regressions.
- Review merged queue interactions and cover any fork integration conflict with focused regression checks. Pass the existing non-Docker gate (regressions, type checks, lint, secret scan) and production Electron build.
- Record upstream marker, commit and push verified development, verify remote ancestry and clean state, and clean exact generated output transactionally.

## Stages

1. Integration and verification - COMPLETE. Acceptance: fork contracts retained alongside upstream queue behavior, conflict-area regressions and complete non-Docker gate plus Electron build pass. Initial development clean, origin divergence 0/0, upstream divergence 159/15. Lyrics conflict retains the shared parser, which already supports whole-second timestamps without losing translated lines. Regression checks verify whole-second/fractional parsing together. Real player-store regression reproduced stale Up Next membership after fork unavailable-song recovery; the recovery action now calls the merged queue normalizer, preserving paused status and PLAYER_QUEUE_SYNC. Regression passed after the fix. Complete non-Docker gate and production Electron build exited zero, including Node/web type checks, ESLint, Stylelint and secret scan. Existing startup hydration, MPV, LidaClips, updater and fullscreen regression checks passed. No installed/runtime playback claim is made.
2. Delivery and cleanup - COMPLETE. Acceptance: marker correct, verified commits pushed, clean branch includes upstream and matches origin, generated output removed. Merge a0706852f1e075c9572f1b76a47fbcd1e8cbb7dc pushed successfully; branch matched origin, with upstream divergence 160/0 before this evidence-only closure. Marker records 36f8e18395b273dca148d1786784ade632918f2b. Cleanup ac9c414e0388a2e41a4f12793767ef1e applied successfully, removing 64,869,396 bytes; both registered roots are absent. No Docker, release packaging/publication, or installed-app changes occurred. No required blockers or deferrals remain.

Closure assessment: queue normalization reuses upstream's existing owner rather than adding a parallel state path. No material design-debt finding requiring additional scope. Unchanged assessment applies to final reconciliation.

## Parent PR observations

- #2593 still reports packaged Electron LAN permission failures; not merged automatically.
- #2549 session retries and #2550 queue clearing remain open and touch fork authentication/queue contracts.
- #2618 changes local lyrics metadata handling; its description lacks normalization test results. Leave unmerged.
- Push diagnostics report 43 dependency alerts including one critical. These are GitHub-reported, not independently assessed or remediated by this upstream-sync run.

Tracked deferrals: none.
