# November 19: mini-player hidden-layout crash and accent background (ba.40)

Authority: the user's 2026-11-19 reports. Asked to make the mini-player background follow the accent colour. Reported "Failed to execute 'removeChild' on 'Node'" after restoring from the mini-player ("it shouldn't have crashed in the first place"), and reproduced it again by clicking the top-right restore button. Standing heartbeat release rules apply: no Docker, no installed-binary replacement, no live profile changes.

## Requirements

- R1: The mini-player turntable background follows the theme accent colour instead of the cover's dominant colour.
- R2: Opening and restoring the mini-player must not crash any page. Fix the cause, not only the symptom.
- R3: Preserve the mounted-desktop design (MPV, video and scroll state survive the round trip) and every fork invariant in `docs/fork-maintenance.md`.
- R4: Verify the change, add a failing-before regression, release ba.40 with nine assets, and check the published installer independently.

## Root cause

The desktop layout stays mounted under the mini-player and was only hidden, so it re-laid out at the mini window's size (240-600 px) while keeping the desktop sidebar. The virtualized item grids (react-window inside AutoSizer, `item-grid-list.tsx`) on Album Artists, Albums and Artists were squeezed to almost no width. React then failed while deleting grid children: `NotFoundError: Failed to execute 'removeChild'`. The page error boundary caught it while hidden, so the user saw it on restore.

Evidence (hidden isolated harness, production builds): ba.38 crashes on those three pages, both on entering the mini-player and on restore; the component stack ends in `VirtualizedGridList` > react-window. Plain window resizes (800/900/780 px and back, without the mini-player) do not crash. Removing the restore handler's `flushSync` does not change the result. ba.39's `content-visibility: hidden` only masked the crash: with that line reverted, current code crashes the same way.

## Fix

`DefaultLayout` records the last desktop viewport width. Widths at or below 768 px use the mobile layout and are never recorded, and nothing is recorded while the mini-player is active. While the mini-player is open, the hidden layout is pinned to that width, and the width is released on restore. A layout first mounted at a mobile width falls back to 1280 px. `content-visibility: hidden` stays as the paint/layout optimisation.

## Verification

- With the `content-visibility` mask removed, the fix alone passes enter-and-restore on all 14 pages (home, explore, favorites, album artists, albums, artists, folders, genres, songs, now playing, playlists, radio, settings, artist detail). The hidden layout stays 1440 px while the mini window is 320 px.
- Final build: no crash, no document overflow (scroll width 320 in mini), and the mini-player screenshot is clean.
- `mini-player-layout-width.test.mjs` executes the production layout hooks and fails on the previous source. It is added to the non-Docker gate. The mini-player, mini-player-renderer and native mini-player runtime contracts pass.
- Accent background: the turntable computes to the theme primary (`#0558fd`) and the queue renders over it.

## Delivery

- Released [v1.15.1-ba.40](https://github.com/Darkaxt/feishin-basic-auth/releases/tag/v1.15.1-ba.40) at 2026-11-19T16:29:41Z (latest, not draft or prerelease) from commit `7f5513e42`, tag pushed atomically with `development`.
- All nine assets' server SHA-256 digests match the locally built candidates. CodeQL push run 44566360224 succeeded.
- The x64 installer was independently downloaded via the latest-release API: 187822079 bytes, SHA-256 `b827d4bc14efd7bd912f25a78f86e97040074c3e8f1df88ef7c1fa01378bd1a9`. Its extracted `app.asar`, `Feishin.exe`, `app-update.yml` and `ffmpeg.dll` are byte-identical to the build. FileVersion is 1.15.1-ba.40, and Electron is 43.8.7.
- The installed app and live profile were not replaced or modified. Users update through the in-app updater.
