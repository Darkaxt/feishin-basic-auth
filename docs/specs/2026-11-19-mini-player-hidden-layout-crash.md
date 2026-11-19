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
