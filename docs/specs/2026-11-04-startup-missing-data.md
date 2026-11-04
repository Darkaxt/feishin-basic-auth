# Startup missing-data notifications

Authority: user reports repeated Error - Data not found on opening Feishin; standing implementation/release authorization and established local repair/deployment authority apply. No Docker or visible test windows.

## Requirements

- R1: Restore quiet startup recovery when saved tracks no longer exist. Expected missing optional lyrics responses must not produce a popup for each obsolete track. Keep missing-song queue recovery intact; do not hide errors globally or remove tracks for network/authentication failures.
- R2: Valid structured/single lyrics and existing remote fallback must still work. Authentication errors must remain visible, and explicit API operations must retain normal error reporting. Prove the production lyrics request path through its actual Subsonic transport against controlled HTTP responses, including missing data, valid lyrics and expired credentials.
- R3: Preserve BasicAuth, updater/profile identity, paused startup recovery, MPV, clips, fullscreen and visualizer behavior. Run focused regressions, existing non-Docker gates and production builds.
- R4: Commit/push, publish normal ba31 with the established Windows artifacts, independently retrieve/verify the delivered installer and packaged change, deploy locally without desktop takeover, and preserve the user profile/settings and managed MPV. Clean spent output transactionally.

## Investigation evidence

Installed FileVersion is ba29; ba30 contains translation changes only. The November 4 18:53 UTC startup log records eight consecutive confirmed-missing song removals, followed by successful authentication and MPV initialization. Current-song metadata refresh already uses silent requests, but the parallel optional local lyrics fetch does not. Subsonic's response interceptor displays Data not found for code 70 before the feature catches the lyrics lookup failure. The feature already treats a lyrics failure as an empty optional result and proceeds with fallback. Reproduce that complete request chain before changing production code.

An independent updater failure, No published versions on GitHub, was also logged. It is not the Data not found notification path; do not broaden this repair into updater redesign.

## Stages

1. Repair and verify startup metadata handling - COMPLETE. Owns R1-R3. Production feature/controller/Subsonic client against loopback HTTP reproduced the missing-track toast before the change, then passed quiet missing probes for both lyrics branches, valid single/structured lyrics, visible explicit errors and authentication failure handling. Both optional probes now use the existing silent flag. Queue/MPV and authentication code are unchanged. The existing non-Docker gate's regressions, native Electron 43.7.0 fullscreen/autohide, both type checks, lint/styles and secrets passed. Initial lint found object ordering in the new test; formatting was fixed, its regression and failed/remaining gate checks reran successfully. Both production Electron and remote builds passed. Closure assessment: reuse existing request policy; no new abstraction or refactoring is needed.
2. Release and local delivery - ACTIVE. Owns R4. Acceptance: complete normal ba31 publication, independently checked installer/payload, profile-preserving local deployment and hidden installed behavior verification, exact cleanup and reconciliation.

No tracked deferrals. Publication, independent delivery verification, installation and cleanup are current-stage acceptance blockers while delivery is active.

History check: both omitted silent flags date to upstream 50fe373f1 (February 18), rather than the November translation-only sync. The current failure was exposed as stale saved song IDs were traversed on startup. The regression now runs in the standard non-Docker release gate.

Scratch: E:/Temp/feishin-startup-20261104 for disposable orchestration; D:/Temp/feishin-startup-20261104 for native profiles/build I/O (sustained native/small-file workload). Existing checkout out/dist are generated packaging outputs. Cleanup transaction 0fc3dc67792d610af129eeeb8f694548 covers these exact roots, begun before creation. Preserve the user's active Feishin/MPV processes and their profile during investigation.

## Delivery preparation

Production Electron/remote builds and Windows x64/ARM64 ZIP, architecture-specific/neutral NSIS installers and blockmaps passed. Updater normalization/artifact checks passed. Hashed all nine required assets. Candidate x64 installer SHA256: 846bc55c646d6d1e74259d0ea4cb0e7d84d963b54c2c68ffb5bfa14bcbd11cad. Candidate app.asar SHA256: 9d8d93061403938cccba4121dfcb2cf89df9db9a2086e7efda72d087532deb49.

The packaged identity is feishin-basic-auth 1.15.1-ba.31. Every packaged build file matches the verified output. Executed the emitted/minified lyrics-fetch function intact for both supported branches, asserting the silent flag, signal and song ID and successful lyrics output. This checks the relevant packaged change in addition to the production-source HTTP regression. No main-process, queue or audio lifecycle patch was included.

Local acceptance will close the original app normally only for installation, hash-check the closed profile across the installer, and use a disposable exact profile copy for hidden verification. Both cloned start-minimized values are synchronized before launch; the original profile's preferences are not changed for testing. The installed app will re-query one logged obsolete song ID against the actual configured server, confirm its missing-data response and absence of a popup, and check paused MPV/queue restoration.
