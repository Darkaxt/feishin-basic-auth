# Vinyl mini-player

Authorization: already authorized by the user's "Lets give it a try" following the square vinyl design. Standing instructions include final release and local delivery. No Docker or visible desktop takeover.

## Required behavior and design contract

- M1: A 320 x 320 default square turntable surface reuses the Now Playing vinyl artwork, theme and playback session. Artwork dominates at rest. Pause preserves the rotation angle and keeps the vinyl visible; Stop returns to the normal cover. This distinction was explicitly clarified by the user during implementation. Reduced motion is respected. Missing artwork has an intentional placeholder.
- M2: Hover or keyboard focus reveals close (upper left), restore (upper right), previous/play-pause/next (center), title/artist, Stop and seek progress/times (bottom). Controls have accessible names, visible focus and keyboard operation. Close dismisses the mini-player without stopping playback.
- M3: The queue expands above the square, keeping its bottom edge anchored. It reflects actual playback order and supports selecting tracks. Its scroll area remains usable at 240-600 pixel square sizes and constrained work areas.
- M4: Minimize with a loaded track enters mini mode, unless the user's explicit minimize-to-tray choice takes precedence or the mini-on-minimize setting is disabled. A player-bar button enters mini mode manually. Mini dismissal genuinely minimizes/hides without reopening itself. Always-on-top defaults on and is configurable live.
- M5: The same BrowserWindow and renderer remain alive. Desktop playback components stay mounted. No duplicate player, audio routing, session or queue. Mode changes preserve paused/playing state and timestamp. Web layout remains unchanged.
- M6: The surface is draggable and resizes with square proportions, remembering its separate bounds. Restore returns the original normal bounds and maximized/fullscreen state. Closing while mini must not overwrite normal-window settings. Disconnected-display bounds are clamped safely. Native OS frame preferences remain respected.
- M7: Preserve BasicAuth/profile/updater identity, paused startup recovery, MPV lifecycle, visualizer, clips and F11. Hidden native and renderer verification must demonstrate relevant transitions; screenshots establish the actual visual result.
- M8: Complete the non-Docker release gate, production Electron and remote builds, final commit/push, normal GitHub release with the established artifact set, independently verify published installer contents/hash and install locally while preserving the live profile. Clean expendable outputs transactionally.

## Stages and reconciliation

| Stage | Status | Requirements | Acceptance and evidence |
| --- | --- | --- | --- |
| Integrated mini-player | COMPLETE | M1-M7 | Hidden Electron 43.7.0 native fixture verifies renderer identity, normal/maximized/fullscreen restoration, pin changes, square resizing, repeated queue bottom anchoring and dismissal. Actual production UI verifies 320 x 320 surface, MPV playback, frozen paused record, Stop cover, 33-track queue selection, minimize entry/opt-out and unchanged desktop identity. Screenshots inspected. |
| Final delivery | COMPLETE | M8 | Non-Docker gates, production Electron/remote builds, packaged behavior, normal GitHub release with nine verified assets, independent installer retrieval/payload checks, actual hidden installed-runtime checks, profile recovery and transactional cleanup pass. |

Final reconciliation: M1-M8 are satisfied and verified. No unresolved blockers, external impediments or tracked deferrals remain.

## Integrated verification

The native fixture uses transparent, nonactivating windows and the release Electron version. Repeated queue toggles exposed a real outer-window/content-bounds rounding drift at 150% Windows DPI. Mini sizing now uses content bounds; repeated toggles and native resize-event handling pass without growth. Normal/fullscreen/maximized geometry and minimum size restore correctly. Native frame preferences remain unchanged.

The real production renderer was loaded from out/renderer/index.html by the actual main/preload bundles under an isolated appData directory. The existing user profile was read into task-private scratch and seeded into that isolated directory, including its encryption key context; the live profile was not used by the test application. Existing managed MPV was selected explicitly, avoiding another runtime download. Test windows were hidden or transparent/nonactivating. MPV native IPC confirmed paused startup, an explicit Play click advanced its clock, and pause=false while playing. The same mini record DOM node survives Pause; its settled CSS transform stays identical across subsequent rendered frames. Stop returns to the cover. The queue is 240 pixels above the 320-pixel square and retains all 33 tracks. Selecting a queue row updates the actual player. The desktop DOM node survives entry and restore.

Restore initially exposed a real responsive-layout race: native resize completed before Chromium received the desktop viewport. Native state now supplies the expected viewport width, and the renderer waits for its actual resize event before leaving mini presentation. The mobile predicate reads the live query in addition to its notification. Hook regressions cover delayed/intermediate viewport updates, superseding requests, stale startup snapshots and subscription disposal. The hidden UI identity check now passes through restore.

Visual review inspected actual served artwork-only, focused controls and queue screenshots. Existing theme tokens, cover loading/explicit-image preferences and reduced-motion handling are reused. All transport controls have accessible labels and the overlay is reachable through keyboard focus; interactive controls and seek area are excluded from native drag regions. The existing full desktop is inert while mini is active.

Stage-closure assessment: no unrelated refactoring is required. The native controller and presentation store serve only the implemented window mode. No second renderer/player or permanent startup mini mode was introduced. Packaged checks and delivery evidence are recorded below.

Final release reconciliation additionally verifies that re-entry chooses the remembered mini-player display, not the desktop window's display. Invalid/disconnected bounds still clamp safely. Native regression coverage includes that display selection. New controls/settings use the established translation system with unchanged English copy. The complete non-Docker gate passed; affected type checks and lint were rerun for these final corrections. Electron/remote production builds passed; completed packaging and published/installed verification are recorded below.

The final x64 packaged app.asar was exercised from its actual packaged file URL in an isolated profile using release Electron 43.7.0. Explicit Play advanced native MPV time from 0.032 to 1.050099 seconds; pause=false while playing. Pause retained the record DOM node and its transform remained `matrix(-0.0231146, 0.999733, -0.999733, -0.0231146, 0, 0)` across settled frames. Stop showed the cover; the 33-track queue occupied 240 pixels above the 320-pixel square; the desktop DOM node remained identical after restore. Fifteen relevant source-map contents in both x64 and ARM64 app.asar match the current source exactly. No visible desktop interaction was used.

## Release and local delivery

Published [v1.15.1-ba.34](https://github.com/Darkaxt/feishin-basic-auth/releases/tag/v1.15.1-ba.34), release ID 437219079, at 2026-11-07T00:50:49Z as the normal latest release. All nine expected assets have the exact candidate sizes and GitHub SHA256 digests; latest.yml selects the architecture-neutral installer. Annotated tag and development were atomically pushed and independently read back at source commit `123fc67ce04a9e1f3d92a101280864c4a985bfd1`. [CodeQL run 42320380758](https://github.com/Darkaxt/feishin-basic-auth/actions/runs/42320380758) completed successfully for Actions and JavaScript/TypeScript.

The independently retrieved published x64 installer is 186,641,016 bytes, SHA256 `9dc5d36e550a09b04abfc54f811977c3a541d62c7915f0343ccafd53e334272f`. Its extracted executable and app.asar match the verified candidate exactly:

- Executable SHA256: `9467b75fbb6368f93ae80096632bc6b7c666638acb696cd7c222395ad3f03462`.
- app.asar SHA256: `264a582d5347a6f632ea69945856048f43f35ac552432225e3757341b592748c`.
- FileVersion: 1.15.1-ba.34; product: Feishin. Signing state remains the established unsigned channel.

The published installer completed a per-user silent installation into the existing Feishin BasicAuth installation. All 698 closed-profile files were byte-for-byte unchanged by installation. Installed executable/app.asar hashes were independently checked against the extracted published payload, and its fifteen relevant source-map contents match the source.

Actual installed main PID 73156 loaded its installed app.asar URL and remained natively hidden through startup, mini entry and full restore (all five owned native windows hidden at each checkpoint). It started paused, rendered the 320 x 320 mini surface and retained the identical desktop DOM node after restore. It exited normally with code 0. Temporary startup/update preferences were restored; the captured original local stores, IndexedDB values and main config were checked by the private recovery helper. Original credentials, queue and preferences remain preserved; Feishin is closed for normal user launch.

An additional packaged HTML-fullscreen round trip verified document fullscreen remained active before, during and after mini mode, complementing the native F11/normal/maximized/fullscreen gate. No Docker or visible desktop takeover was used. Final cleanup and reconciliation are recorded below.

## Cleanup

Disposable scripts/captures/downloads: E:\Temp\feishin-mini-20261107. Native fixtures, extracted Electron and packaging scratch: D:\Temp\feishin-mini-20261107 (sustained/small-file I/O exception). Existing bound build outputs remain repository out/ and dist/. Cleanup transaction c17728d289ecc731632a04d197e7197e inventories only these exact roots.

Transactional cleanup inspected all 3,208 signed-manifest members before separate ticket issuance. Manifest SHA256 `57a1e12a80886b82e5c89cfb756447a9200dfcb21236e498eac07621802f9c7c`; apply deleted every reviewed member and 4,178,389,301 logical bytes, without exclusions, warnings or errors. Installed binaries/profile, persistent managed MPV and the published release were preserved.

The separate review-controller root E:/Temp/feishin-mini-cleanup-20261107 was retired through transaction 4c19e2c7ec5ccc1337916d2377cb3f29 after all three manifest members were inspected. Manifest SHA256 `92ca2a2bbc565a8e7cfb86042c47c39eb3907dde2d9e839bf13ad180d8879ed1`; all three members and 2,741,568 logical bytes were deleted without warnings or errors. Both task Temp roots, the controller root and checkout out/dist are absent. Installed executable/app.asar hashes remain identical to the verified delivered payload after cleanup. No temporary consumer or cleanup residual remains.
