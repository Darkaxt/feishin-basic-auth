# October 11 upstream maintenance

Authorization: scheduled Feishin upstream maintenance. No Docker, release packaging, publication, installation, or unmerged PR integration.

## Required outcome

- Integrate upstream development from 7e1bf98dc through 9dc15477c (one Weblate translation commit).
- Preserve BasicAuth and updater identity, MPV queue/recovery and startup restoration, LidaClips, fullscreen behavior, and fork regressions.
- Pass the existing non-Docker source gate (regressions, Node/web type checks, lint, secret scan) and production Electron build.
- Update sync marker, commit and push verified development, clean only task-generated output.

## Stages

1. Integration and verification - COMPLETE. Acceptance: exact translation-only upstream diff integrated without changing fork production behavior; gate and Electron build pass. Initial branch clean, origin divergence 0/0, upstream divergence 157/1. No unverified local-only commits. Conflict-free merge changes only de/es/et/fr/zh-Hant locale JSON files. Fresh complete non-Docker gate and production Electron build both exited zero. Fork regressions, Node/web type checks, ESLint, Stylelint, and secret scan passed. No conflict-specific changes were necessary.
2. Delivery and cleanup - COMPLETE. Acceptance: marker correct, verified integration committed and pushed, clean development matches origin and includes upstream, generated output removed. Merge 01e2f88ca pushed successfully; upstream divergence became 158/0. Marker records 9dc15477c86fbd48d1a98fa878769d09811895e8. Cleanup transaction a9058a74ac22e674ef886e07079deb13 applied successfully, removing 52,334,451 bytes with the out root absent. Final evidence recorded in this documentation commit.

## Parent PR observations

- #2593 reports Local Network Access permission failures in packaged Electron 43 applications, affecting private-address servers. It changes main-process permission handling and needs fork-aware review if merged upstream; not integrated automatically.
- #2549 session retry handling and #2550 queue clearing remain open and touch authentication/queue boundaries. Neither is integrated automatically.

Blockers: none. Tracked deferrals: none.
