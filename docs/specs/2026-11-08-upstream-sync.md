# November 8 upstream maintenance

Authority: current upstream heartbeat and standing implementation/release instructions. No Docker, unmerged parent PR integration, installed-binary replacement or live profile/playlist changes.

## Requirements

- R1: Integrate upstream development `76fa20e08d8d17774e45e960dbd90ea0cef14bba..155e562138f39adaa985a01bc974936925518b46`: Electron 43.8.6, Linux MPRIS DesktopEntry and skip-forward duration conversion. Initial development/origin divergence is 0/0; fork/upstream divergence is 185/3. The only changes after the delivered ba.35 source are delivery documentation.
- R2: Preserve BasicAuth and updater/profile identity, MPV ownership/queue/recovery and paused startup, clips, visualizer, F11 and ba.35 mini-player behavior. Preserve dependency security overrides and packaging patches; align Electron's dependency override and all packaged runtime pins with the integrated upstream runtime. Resolve conflicts from current code and specification evidence.
- R3: The parent PR inspection exposed a concrete playlist data-integrity risk under standing Section 3: reorder events and the edit handler identify occurrences by song ID, while the table identifies them by playlist-entry ID. Repeated songs can collapse in the edit model saved by SaveAndReplaceButton. Independently reproduce and correct the existing event producers, selection positioning and edit handler to use the established row identity, preserving duplicate occurrences and the complete save payload. This is an independent root-cause repair, not merging an unmerged PR. Do not mutate a real playlist to test it.
- R4: Verify focused skip-forward and duplicate-occurrence reorder/save regressions, the complete existing non-Docker gate, type checks, lint, production Electron/remote builds, and hidden native checks using Electron 43.8.6. Verify relevant packaged code and native fullscreen/mini-player behavior under that exact runtime. No visible desktop takeover or installed-app testing.
- R5: Update the upstream marker, commit/push verified development, publish normal ba.36 through the established GitHub channel with all nine Windows artifacts. Independently retrieve/hash-check the published installer, verify runtime/version/updater identity and affected packaged behavior, and reconcile the final result. Preserve the installed binary/profile. Clean expendable task outputs transactionally.
- R6: Inspect current relevant parent PRs and report material open risks without merging them. Evidence from PR descriptions remains a reported claim until established in this fork. Avoid unrelated feature additions and speculative refactoring.

## Stages and reconciliation

| Stage | Status | Acceptance |
| --- | --- | --- |
| Integrate and verify | COMPLETE | R1-R3, source/native/build checks from R4 and marker/PR inspection from R5-R6. Controlled merge and bounded playlist repair, all required source checks, native Electron 43.8.6 fullscreen/mini-player and both production builds pass. |
| Release and reconcile | ACTIVE | R4 packaged verification and remaining R5-R6. Source/tag push, normal final release with required assets, independent download/payload/runtime checks, cleanup and final reconciliation remain. |

Current advancement blockers are internal delivery work: packaging, packaged verification, publication, independent retrieval and cleanup remain. R4 packaged checks explicitly belong to the final delivery stage; source acceptance does not depend on yet-unbuilt release artifacts. There are no tracked deferrals or external impediments.

Implementation checkpoint: packaging conflicts retain the fork's literal artifact name, app ID and updater owner while adopting Electron 43.8.6. The lockfile was regenerated from the fork's protected dependency graph, changing only Electron and its peer references; all security overrides and four dependency patches remain. Installed dependencies now use that same runtime, avoiding the former 43.4.1 development override versus 43.7.0 packaged split. Native gates reuse the installed dependency runtime rather than extracting a second copy.

Playlist reproduction failed against the original production callbacks: moving the second copy could remove the first occurrence, and multi-selection could substitute the same entry twice. All reorder controls and both drop paths now use the existing table extractRowId contract, and the edit handler maps playlist-entry IDs. The complete production callback-to-edit-model-to-save-ID flow passes for Up/Down/Top/Bottom, both drop targets, multiple occurrences, another-playlist isolation and unique-ID fallback. No real playlist was edited. The incoming skip-forward conversion passes a production callback regression with synchronized store/seek timestamps near track end. Required full gate and builds are the remaining stage-one acceptance work.

Source-stage closure: the existing non-Docker gate's native fullscreen/mini-player runs, every fork regression group and node type check passed under Electron 43.8.6. Web typing exposed the generic row extractor's optional return type; playlist edit tables and validated songs already guarantee string row IDs, so payload sites now express that invariant without changing runtime behavior. Focused production callbacks were rerun after formatting; corrected web type check and the remaining full ESLint, styles and secret checks passed. These inspected unchanged native/test results and the completed affected checks satisfy every non-Docker gate check without another redundant suite run. Electron main/preload/renderer and remote production builds passed. Closure assessment: the correction reuses table identity and existing state/event ownership; no new abstraction, fallback branch or architectural refactoring is required.

## Candidate verification

Both x64 and ARM64 app.asar files contain version 1.15.1-ba.36 and eleven affected/protected source maps exactly equal to current source. Verification executed the actual emitted JavaScript: the skip-forward callback caps seek/store values in seconds, the playlist consumer preserves distinct occurrences and duplicate song IDs, and all six emitted reorder producers use row identity for their target. This is compiled-package behavior, not only source-map matching.

The actual compiled native mini-player controller and bounds functions extracted from the candidate archive passed the existing real Electron 43.8.6 native fixture: same renderer, normal/maximized/fullscreen restore, queue bottom anchoring and direct dismissal. All fixture windows remained hidden/nonfocusable. The separately verified production fullscreen/permission fixture covers display bounds, restore, autohide/reveal and visualizer targeting. No installed app or real playlist was launched/modified.

Windows x64/ARM64 ZIPs and NSIS installers, architecture-neutral NSIS, blockmaps and updater metadata built successfully. Artifact validation passed for all nine deliverables, with latest.yml selecting the neutral installer. Candidate x64 installer SHA256 is `51ce8407ebc2c9f0bbf2835afb7cbedeb587b1fa0c78661fdd31a86a59a631e4`; executable is `1e65b7d718c82768e8805fc8bb15c8af6411e95073c7b015c12dd756115bf1ea`; app.asar is `8b552292b6de5f1b6b4c01a26141bd94476e318c0f9fbbef90e542640e58f727`. Updater identity targets Darkaxt/feishin-basic-auth. Publication, independent retrieval and cleanup remain required.

## Execution and recovery

Canonical checkout remains C:/Users/darka/Documents/Projects/feishin-basic-auth. Disposable scripts/downloads use E:/Temp/feishin-sync-20261108. Native runtime, dependency/download cache and packaging scratch use D:/Temp/feishin-sync-20261108 because they require sustained/small-file I/O. Existing out/dist remain bound checkout outputs. Pre-creation cleanup transaction `9392336916d433fad69a899c02bb3b52` covers these exact four roots; source, installed app/profile, shared dependency store and managed MPV are excluded.

Reuse existing project verification/build/normalization/artifact scripts. Task-owned run.ps1 supplies short child PATH and scoped scratch/runtime/cache settings. Release checks use an isolated native fixture, not the live user profile. Final deliverable is the published release; this heartbeat does not replace the locally installed app.

Thread recall initially encountered a busy shared index while the scheduled collector owned the SQLite writer. The exact collector process was observed through completion; recall then refreshed successfully. No cache, collector or database state was modified to bypass its owner.

## Parent PR review

- #2642 and #2665 remain open and touch MPV ownership, sleep recovery and startup autoplay. Their proposed debounce/network timeouts were not copied; fork paused-startup and owned-instance recovery remain protected by the existing gate.
- #2677 remains open and describes stale-session retries clearing fresh credentials. It overlaps the fork's session/stream protections; no unmerged code was integrated.
- #2654 remains open with reported low-sample-rate EQ silence. This run does not establish a new regression or change user EQ settings.
- #2684 remains open. Independent production callback reproduction established the occurrence-loss defect in this fork; the bounded correction also covers event producers and movement controls that a handler-only change would miss.
- #2692 remains open; its genre-context-menu fix is already covered by the fork's existing implementation/regression.
- #2651 is closed without merging. The current merged upstream Electron 43.8.6 upgrade is included from development, not from that PR.

PR metadata and bodies were read through the connected GitHub API. No unmerged parent PR was merged or cherry-picked.
