# November 1 upstream maintenance

Authority: current upstream heartbeat and standing release authorization. No Docker, unmerged parent PR integration or local installed-binary replacement.

## Requirements

- R1: Integrate upstream development efaed0c5778a4221c297529c7ca69f2c825ca730..76fa20e08d8d17774e45e960dbd90ea0cef14bba, comprising Thai and Swedish translations. Initial clean development/origin divergence is 0/0; fork/upstream divergence is 173/2.
- R2: Preserve BasicAuth, updater/profile identity, MPV queue/recovery and paused startup, clips, fullscreen and visualizer fixes. Verify exact changed paths, locale JSON/interpolation contracts, the existing non-Docker gate including native Electron 43.7.0 fullscreen, type checks, lint and production builds.
- R3: Commit/push development, publish normal ba30 with the established nine Windows assets, independently retrieve/hash-check the installer and verify its packaged version, identity, translations and preserved permission behavior. Do not change the installed application or user profile.
- R4: Update the sync marker; inspect relevant open parent PR risks without merging them. Clean spent generated output transactionally.

## Stages

1. Integrate and verify - COMPLETE. Owns R1-R2 and the marker/PR inspection from R4. Conflict-free merge changes only the two upstream locales; fork runtime code remains byte-for-byte unchanged. Parsed both JSON resources and checked all changed English-matched interpolation tokens (94 Thai and 671 Swedish changed keys). The complete non-Docker gate passed, including real hidden Electron 43.7.0 fullscreen/display bounds, exit restoration and autohide, adjacent fork regressions, both type checks, lint/styles and secret scan. Production Electron main/preload/renderer and remote builds passed. Closure assessment: no new state ownership or abstraction; no refactoring needed.
2. Release and reconcile - ACTIVE. Owns R3 and remaining R4. Acceptance: verified commit/push, normal complete ba30 publication, independent delivered-package verification, exact cleanup and final reconciliation.

## Evidence and reconciliation

Upstream adds only src/i18n/locales/th.json and sv.json. Development contains only the ba29 delivery-evidence document beyond the current release; no pending unreleased product fix was found. No runtime refactoring or additional fixes are required by this translation integration.

Scratch: E:/Temp/feishin-sync-20261101 for disposable orchestration and receipts; D:/Temp/feishin-sync-20261101 for native runtime/profile and packaging I/O. D: is required for sustained native/small-file I/O. Existing checkout out/dist are unavoidable generated build outputs. Cleanup transaction a3979527175f88b10956a8266e8474ad covers these exact roots.

No tracked deferrals. Packaging/publication and independent delivery verification remain current-stage acceptance blockers and are being completed.

The first build wrapper failed while printing its Unicode log tail under cp1252 after the production build finished. All three build completion records were inspected in the retained UTF-8 log; the wrapper was corrected to emit UTF-8. This was an orchestration output error, not a product build failure. Native runtime/profile are retained for the delivered-package permission check, then removed with the original pre-creation cleanup transaction. A redundant post-creation native-only inventory (66366ac9914ece4c127b8221ab77d504) protected its baseline members and was discarded without deleting anything.

## Parent PR risks

- #2665 and #2642 remain open: suspend recovery and optional startup autoplay touch the fork's process ownership and paused recovery contract. Future integration must preserve paused startup and must not copy proposed timeout/debounce behavior without evidence.
- #2677 remains open: author reports stale authenticated requests clearing a fresh session and reusing expired stream credentials. This is a relevant server/session risk, not a verified regression in this fork or an included fix.
- #2654 remains open: author reports MPV equalizer silence at low sample rates. It is not part of the upstream development delta.
- #2651 remains open: proposes Electron 43.8.3 for a reported CA distrust issue. The claim has not been independently assessed here and no dependency upgrade is included.

Read the current PR bodies and state through the GitHub API. No unmerged PR was integrated.

## Release preparation evidence

Windows x64/ARM64 ZIP and NSIS packaging, architecture-neutral NSIS, blockmaps and normalized updater metadata passed. All nine candidate assets were hashed. The packaged app identity is feishin-basic-auth 1.15.1-ba.30. Every packaged out file matched the verified build output. The emitted JavaScript's reconstructed Swedish and Thai resource objects exactly equal the merged source JSON (1,498 and 271 string values), rather than relying on source maps or a source-only check.

The compiled packaged permission callbacks passed own/foreign frame/document, automatic fullscreen, scoped capture and microphone-denial checks. Those same compiled callbacks passed the real hidden Electron 43.7.0 F11/display-bounds/exit/autohide workflow. Native test windows ended invisible, nonfocusable and opacity zero. This uses the established source hook fixture with the packaged main-process permission/capture code; it does not launch the user's installed app.

Candidate app.asar SHA256: 8d38b126aec8c8d7dd33de5325d08e9b0ab4c3d896c8b964d6cff06d248dee0e. Candidate x64 installer SHA256: b0fa9f8948e368d2cf1df59c2def9839f64c047125bfc6a1a3a180eede3ca4e1. Publication/readback and independent installer retrieval remain pending stage-two criteria.
