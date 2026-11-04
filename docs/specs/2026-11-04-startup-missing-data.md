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
2. Release and local delivery - COMPLETE. Owns R4. Normal ba31 publication, independent installer/payload verification, installation, final hidden native verification against the real server, preference/queue recovery and exact cleanup passed. The initial visible-test execution failure remains explicitly recorded below; it is not represented as compliant execution. Closure assessment reuses stage one's bounded change assessment. No product acceptance blocker or tracked deferral remains.

No required product blockers or tracked deferrals remain. Source, delivered package and installed behavior satisfy R1-R4's functional/delivery acceptance criteria. The historical execution failure and its corrective actions are recorded without claiming the hidden-test constraint was met throughout the run.

History check: both omitted silent flags date to upstream 50fe373f1 (February 18), rather than the November translation-only sync. The current failure was exposed as stale saved song IDs were traversed on startup. The regression now runs in the standard non-Docker release gate.

Scratch: E:/Temp/feishin-startup-20261104 for disposable orchestration; D:/Temp/feishin-startup-20261104 for native profiles/build I/O (sustained native/small-file workload). Existing checkout out/dist are generated packaging outputs. Cleanup transaction 0fc3dc67792d610af129eeeb8f694548 covers these exact roots, begun before creation. Preserve the user's active Feishin/MPV processes and their profile during investigation.

## Delivery preparation

Production Electron/remote builds and Windows x64/ARM64 ZIP, architecture-specific/neutral NSIS installers and blockmaps passed. Updater normalization/artifact checks passed. Hashed all nine required assets. Candidate x64 installer SHA256: 846bc55c646d6d1e74259d0ea4cb0e7d84d963b54c2c68ffb5bfa14bcbd11cad. Candidate app.asar SHA256: 9d8d93061403938cccba4121dfcb2cf89df9db9a2086e7efda72d087532deb49.

The packaged identity is feishin-basic-auth 1.15.1-ba.31. Every packaged build file matches the verified output. Executed the emitted/minified lyrics-fetch function intact for both supported branches, asserting the silent flag, signal and song ID and successful lyrics output. This checks the relevant packaged change in addition to the production-source HTTP regression. No main-process, queue or audio lifecycle patch was included.

The app was closed normally for installation; all 583 closed-profile files / 361,500,008 bytes matched before and after the installer. The initial profile-copy isolation plan failed at the actual app boundary and was corrected as recorded below. Final installed verification used the normal profile with temporary, explicitly synchronized start-minimized settings, followed by restoration and read-back. It re-queried a logged obsolete song ID against the actual configured server and checked notification behavior plus paused MPV/queue restoration.

## Published and installed evidence

Normal latest release: https://github.com/Darkaxt/feishin-basic-auth/releases/tag/v1.15.1-ba.31. Source/tag fd64d29b99b7217fdc5d6c781b301735059abfda and development were atomically pushed and remote refs read back. CodeQL run 41894951780 completed successfully at that source SHA. All nine published assets' sizes and SHA256 digests matched candidates. Independently downloaded the published x64 installer, verified its candidate hash, extracted the payload and executed its emitted lyrics-fetch function for both branches. The executable and app.asar matched the candidates and actual installation. PE FileVersion is 1.15.1-ba.31; the executable remains unsigned, matching the established channel. Updater configuration targets Darkaxt/feishin-basic-auth.

Installed executable SHA256: 8f0fc38c8698736735b7592919c28daea081a5baf19d7c62cebc21f260da677e. Installed app.asar SHA256: 9d8d93061403938cccba4121dfcb2cf89df9db9a2086e7efda72d087532deb49.

Final native installed verification invoked the actual packaged local lyrics function against the configured server for the logged obsolete Eclipse ID. The real server returned Subsonic code 70 / data not found. A DOM observer of Notification roots and alerts recorded no missing-data toast; local lyrics returned null. Persisted queue hydration, 50 entries, MPV initialized/running and paused playback passed. No play command was sent. Main/renderer start-minimized values were both true during this run. Win32 visibility checks confirmed the owned native windows were hidden; Chromium's document.hidden remained false for this never-shown window and was not used as native visibility evidence.

The test app and owned children exited normally. Native storage read-back restored the original full window settings and lyrics.fetch=true, plus main start-minimized=false and the saved window bounds/state. Read-only IndexedDB comparisons with the pre-test profile copy confirmed identical queue membership, order, shuffle/priority data and current index 4. Installed hashes were rechecked against the independently downloaded payload. Feishin is closed for the user to reopen normally. Evidence-only closure is separate from the release source/tag.

## Verification execution incident

The initial installed launch did not honor the assumed profile isolation: passing --user-data-dir did not redirect this packaged Electron app's stores, and it briefly surfaced the app. This violated the hidden-test execution constraint; it is an execution failure, not a satisfied constraint or an authorized scope change. The user was informed. The test instance was closed, the temporary lyrics.fetch change was restored from the independent pre-test copy, and final verification used both real-profile start-minimized values synchronized explicitly. That final run stayed natively hidden. A broad body-text check also matched page content rather than notifications; the corrected observer measures actual Notification/alert elements and case-insensitive server error text. The product code and release did not change during these diagnostic corrections.

The profile copy was retained only for required recovery/read-back and was compared before cleanup. Normal runtime logs/cache and metadata files changed during installed tests; byte-for-byte profile preservation is claimed across installation only. Queue and affected preferences were independently checked/restored afterward. This incident cannot be retroactively undone; no perfect execution-compliance claim is made. All required product behavior and final hidden-verification criteria are now verified.

## Cleanup

Transaction 0fc3dc67792d610af129eeeb8f694548 inspected all 3,532 signed manifest members before its separately issued ticket. Apply removed all 3,532 members / 4,286,906,373 logical bytes, with no warnings, errors or exclusions. The exact E:/Temp/feishin-startup-20261104, D:/Temp/feishin-startup-20261104 and checkout out/dist roots are absent. The original user profile, installed ba31 application, published release and managed MPV runtime are retained. No verification process, temporary profile, recovery copy or task scratch residual remains.
