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
| Final delivery | ACTIVE | M8 | Final non-Docker gate, production remote build/packages, published artifact verification and local installation verification; cleanup remain. |

Current advancement blockers: M8 delivery remains internal work. No external impediments or tracked deferrals.

## Integrated verification

The native fixture uses transparent, nonactivating windows and the release Electron version. Repeated queue toggles exposed a real outer-window/content-bounds rounding drift at 150% Windows DPI. Mini sizing now uses content bounds; repeated toggles and native resize-event handling pass without growth. Normal/fullscreen/maximized geometry and minimum size restore correctly. Native frame preferences remain unchanged.

The real production renderer was loaded from out/renderer/index.html by the actual main/preload bundles under an isolated appData directory. The existing user profile was read into task-private scratch and seeded into that isolated directory, including its encryption key context; the live profile was not used by the test application. Existing managed MPV was selected explicitly, avoiding another runtime download. Test windows were hidden or transparent/nonactivating. MPV native IPC confirmed paused startup, an explicit Play click advanced its clock, and pause=false while playing. The same mini record DOM node survives Pause; its settled CSS transform stays identical across subsequent rendered frames. Stop returns to the cover. The queue is 240 pixels above the 320-pixel square and retains all 33 tracks. Selecting a queue row updates the actual player. The desktop DOM node survives entry and restore.

Restore initially exposed a real responsive-layout race: native resize completed before Chromium received the desktop viewport. Native state now supplies the expected viewport width, and the renderer waits for its actual resize event before leaving mini presentation. The mobile predicate reads the live query in addition to its notification. Hook regressions cover delayed/intermediate viewport updates, superseding requests, stale startup snapshots and subscription disposal. The hidden UI identity check now passes through restore.

Visual review inspected actual served artwork-only, focused controls and queue screenshots. Existing theme tokens, cover loading/explicit-image preferences and reduced-motion handling are reused. All transport controls have accessible labels and the overlay is reachable through keyboard focus; interactive controls and seek area are excluded from native drag regions. The existing full desktop is inert while mini is active.

Stage-closure assessment: no unrelated refactoring is required. The native controller and presentation store serve only the implemented window mode. No second renderer/player or permanent startup mini mode was introduced. Final packaged checks remain in M8.

Final release reconciliation additionally verifies that re-entry chooses the remembered mini-player display, not the desktop window's display. Invalid/disconnected bounds still clamp safely. Native regression coverage includes that display selection. New controls/settings use the established translation system with unchanged English copy. The complete non-Docker gate passed; affected type checks and lint were rerun for these final corrections. Electron/remote production builds passed, with final packaging and published/installed verification still pending below.

The final x64 packaged app.asar was exercised from its actual packaged file URL in an isolated profile using release Electron 43.7.0. Explicit Play advanced native MPV time from 0.032 to 1.050099 seconds; pause=false while playing. Pause retained the record DOM node and its transform remained `matrix(-0.0231146, 0.999733, -0.999733, -0.0231146, 0, 0)` across settled frames. Stop showed the cover; the 33-track queue occupied 240 pixels above the 320-pixel square; the desktop DOM node remained identical after restore. Fifteen relevant source-map contents in both x64 and ARM64 app.asar match the current source exactly. No visible desktop interaction was used.

## Storage

Disposable scripts/captures/downloads: E:\Temp\feishin-mini-20261107. Native fixtures, extracted Electron and packaging scratch: D:\Temp\feishin-mini-20261107 (sustained/small-file I/O exception). Existing bound build outputs remain repository out/ and dist/. Cleanup transaction c17728d289ecc731632a04d197e7197e inventories only these exact roots.
