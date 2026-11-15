# November 15 upstream maintenance

Authority: current upstream heartbeat and standing engineering/release instructions (already authorized). No Docker, unmerged parent PR integration, installed-binary replacement, desktop takeover or live profile/playlist changes.

## Requirements

- R1: Integrate the eleven upstream development commits `155e562138f39adaa985a01bc974936925518b46..98dbd79755864af7461d9d0665bc7b8dd9896a62`. Initial development/origin divergence is 0/0, fork/upstream 187/11 at fork `d0668d96bc43dc0cef750b54d162e0bc22f6a6c1`. Inspect relevant parent PRs without merging them.
- R2: Preserve BasicAuth request handling, updater/profile identity, MPV owned-process queue/recovery and paused startup, LidaClips foreground/background, visualizer device recovery, native F11/autohide, vinyl mini-player lifecycle/hit areas/queue, and duplicate playlist-occurrence identity. Resolve conflicts from production code and existing specifications/regressions.
- R3: Integrate upstream's random-song genre identity/name mapping, multi-folder Navidrome random/search, next-album index, playlist title/refresh, web jukebox selection, missing lyric metadata and Japanese translations. Preserve fork security overrides and packaging stream-close correction while updating the dependency graph; align all Electron pins to 43.8.7. Add meaningful focused regression coverage for affected production behavior.
- R4: Verify the complete existing non-Docker source gate, focused affected regressions, node/web types, lint/styles/secrets, production Electron/remote builds, and hidden native fullscreen/mini-player checks. Dependency changes to React/Mantine/virtual lists require rendered application verification in an isolated hidden window without changing the live profile or audio routing. Compilation/application execution waits for the entire source integration to be ready.
- R5: Update upstream marker and fork version to the next normal release (ba.37), commit/push verified development, and deliver a normal published GitHub release through the established fork channel with all nine Windows assets. Independently retrieve/hash-check the published installer, verify actual package version/runtime/updater identity, affected compiled behavior and native lifecycle. The installed app and live profile remain untouched.
- R6: Clean task-generated expendable outputs through the installed transactional helper after their last consumers exit; reconcile all requirements and retain concise verification, delivery and cleanup evidence here.

## Stages and reconciliation

| Stage | Status | Acceptance |
| --- | --- | --- |
| S1 Source integration | COMPLETE | R1-R3, source portions of R5; all source changes, dependency patch migration and prepared tests present and inspected. Source ready for validation is not a correctness claim. |
| S2 Integrated verification | COMPLETE | R4 complete integrated source/native/rendered/build checks and cohesive formatting/dependency corrections pass. |
| S3 Final delivery | ACTIVE | Remaining R5-R6: package/published verification, source/tag push, normal release, independent retrieval, cleanup and complete reconciliation. |

Current advancement blockers: S3 packaging/publication/independent delivered-package verification and cleanup remain internal required work. Resolution is the complete verified normal release and cleanup evidence. No tracked deferrals or external impediments.

## Whole-scope source readiness

S1 source ready for validation at normalized content SHA256 `d4894fcf4af17e41cf9e4ef0226ebde4bcc86ade03e4c3a46ef0951568fde0ee` across 1,374 source/config/patch/script paths. All eleven incoming commits are integrated in the worktree. Main/beta conflicts preserve fork artifact identity while adopting Electron 43.8.7; alpha and the dependency override match. Genre context menu retains the fork's explicit genre contract and regression. Default layout retains the same mounted desktop/mini-player lifecycle while accepting web jukebox initialization. Existing occurrence-ID event producers survived the formatting merge. BasicAuth/session/MPV/visualizer/native-window implementations outside the upstream delta remain present.

The lock was reconciled against upstream's exact direct resolutions (including Mantine 9.7.5 and React 19.3.1), preserving router 8.3.0, every security override and all minimatch patches. DOMPurify/nanoid overrides advance to the higher incoming versions. Registry-integrity-checked app-builder-lib 26.18.0 still settles before its output handle closes. The old patch's context changed because upstream now returns exit code/stderr; the first dependency-link attempt failed without executing app compilation. The patch was regenerated against that exact new source, preserving both close-before-success and close-before-error behavior. This is a cohesive dependency migration correction, not a removed regression guard.

Prepared production-callback tests cover multi-folder random/search filters and errors, single-folder delegation, missing lyric artists, persisted genre migration, browser jukebox and next-album queue index; the new file is in the existing non-Docker gate. All application/native/runtime acceptance remains unexecuted. Launch path: task run.ps1 dependency install, focused callback/packaging checks, complete non-Docker gate, then Electron/remote production builds and hidden isolated rendering. No source-stage architecture debt or additional abstraction requires consolidation.

## Integrated verification

The complete non-Docker gate executed every native/fork regression group and both node/web type checks successfully under Electron 43.8.7. Its lint step exposed new test object ordering and formatting changes required by incoming Prettier 3.9.10 in four protected fork files. A cohesive formatting-only correction passed full ESLint/Stylelint; affected production playlist, genre, visualizer and new library callbacks passed again. Secret scanning initially encountered the deleted patch name still in the merge index; staging the verified rename resolved that inventory condition without changing the scanner. The final secret scan passes. These inspected unchanged results plus affected revalidation satisfy every source-gate check; no redundant complete-suite rerun was performed.

Production Electron main/preload/renderer and remote builds passed. Eleven changed Japanese keys parsed and matched English interpolation tokens. Final normalized source/config/script/patch content fingerprint is `66a4762e88dccf4aa291ff83944d0cfd20c0693776d57bcf2fb96fb4e6af4964` across 1,373 paths. Closure assessment: the changes reuse existing ownership/controllers and preserve occurrence identity; no required consolidation or new abstraction remains.

A closed-profile snapshot was copied to the registered isolated D: root. Actual production renderer assets ran hidden/nonfocusable with ignored physical mouse input, under Electron 43.8.7, without changing the installed app or live config. Native production fixtures passed fullscreen display bounds, restore, autohide/reveal, visualizer targeting, same-renderer mini-player, queue bottom anchoring and dismiss/reenter behavior. Rendered mini-player checks passed at 240/320/600 pixels: covers fully loaded, every button center hits its own control, playback controls are equally spaced, the hover overlay is visible, queue highlights the current occurrence and contains seek/timestamps, and restore completes. Screenshots were inspected. Startup remained paused. Real authenticated song, user, ping and cover requests returned HTTP 200; the server's unsupported jukebox capability probe returned 501 without a renderer error. No real playlist or output routing was changed.

The first hidden harness set an extra NODE_ENV=production value, triggering an undeclared optional debug source-map-support import. Removing that harness-only environment override restored the normal packaged launch environment; no speculative production patch was made. The final repeated rendered run passed with no renderer console errors. All fixture processes and their MPV instances exited; installed executable/archive and live config hashes still match their pre-validation baseline.

## Candidate delivery verification

Windows x64/ARM64 ZIPs and NSIS installers, neutral NSIS, three blockmaps and latest.yml built successfully with electron-builder 26.18.0. The established artifact helper validates all references and selects the neutral default installer. All nine artifacts have a recorded size/SHA256 candidate manifest. The x64 installer is 187,828,140 bytes, SHA256 `9b08558b33cbd3d110dd6f6f6358896e39d69d0e6ccf8daddb535db109efc2ef`. Candidate executable SHA256 is `4b85bf2881d4457b3406ee6dbba0969e1967d6e78ca22e787d3dbb16334e64f1`, app.asar is `b0edc800b842a43798ed19b69cc7a47a04d91871222acbea1d83594ef3d3f614`. FileVersion is 1.15.1-ba.37; the channel remains unsigned. Updater configuration targets Darkaxt/feishin-basic-auth with the established cache identity.

Both architecture archives contain seventeen exact protected/affected source maps equal to the verified current source. Actual emitted JavaScript executed successfully for missing-artist lyrics, multi-folder random genre/filter mapping, filtered/paginated search with single-folder delegation, skip-forward duration cap and distinct playlist occurrence preservation. The actual native mini-player controller and bounds extracted from the candidate archive also pass the unchanged hidden Electron 43.8.7 native contract, including same renderer, normal/maximized/fullscreen restore, queue anchoring and dismissal. Source verification is complete; final publication, independent retrieval and cleanup remain required.

## Execution and recovery

Canonical checkout retains its existing C: binding. Disposable scripts/logs/downloads use E:/Temp/feishin-sync-20261115. Native/dependency/packaging scratch uses D:/Temp/feishin-sync-20261115 because these operations require sustained/small-file I/O. Existing out/dist remain bound checkout outputs. Pre-creation transaction `5bc1cae127befb0437c8fc78f93dc2cf` covers exactly these four roots; installed app/profile, managed MPV and shared dependency store are excluded. Task child scratch and supported download caches must use the scoped D: root. Reuse project gates/build/artifact helpers; do not run the Docker `--full` gate.

No Feishin process was present at initial inspection. Recheck before any isolated profile snapshot. No production application execution, builds or compiled tests have run at this checkpoint.

## Parent PR review

Current open PR metadata and bodies were retrieved through the connected GitHub API (44 open PRs). #2642/#2665 concern MPV sleep/startup ownership, #2677 stale-session credential clearing, #2684 duplicate playlist ordering, #2506 the standard upstream mini-player, #2709/#2484 HTTP headers, and #2654 low-rate EQ silence. Preserve existing fork protections and its vinyl design; reported claims alone do not establish a new defect here. No unmerged code is integrated.
