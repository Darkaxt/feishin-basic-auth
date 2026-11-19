# November 19 maintenance: artist relations, performance/UI QA and upstream sync

Authority: the user's 2026-11-19 request (take over the Codex Feishin thread, replicate the upstream sync task, run a performance/UI QA round with autofix, add genre and similar-artist links to the artist page, cross-check the Navic fork) plus the standing upstream heartbeat (now Reframe task `feishin-upstream-sync-release-weekly`). No Docker, no unmerged parent PRs, no installed-binary replacement, no live profile/playlist/audio-routing changes.

## Requirements

- R1: Integrate upstream `98dbd797..e36c5a958` (Weblate et/nb-NO translations). Initial fork/origin 0/0 at `713442053`, fork/upstream 191/1.
- R2: Artist pages show genre links and related-artist links even when the server provides neither. Evidence: Navidrome 0.64.2 stores no artist genres, only 10 of 1,696 artists have similar-artist data (Last.fm disabled, agents deezer/listenbrainz); albums carry genres. Fallback derives artist genres from the artist's albums and related artists from library albums sharing the primary genres (Navic-style local matching). Server data stays preferred; library matches only top up to 12 when the server returns fewer than 6.
- R3: Performance/UI QA with autofix: mini-player and its queue must not re-render the whole tree each playback tick; mini mode keeps the main layout mounted (MPV/video/scroll state) without painting it; artwork requests sized for the largest mini-player; stable visualizer connect callback; blob artwork URLs revoked; accessible queue tabs/region; empty top-songs table avoided.
- R4: Preserve all fork invariants in `docs/fork-maintenance.md` (BasicAuth, updater identity, MPV queue/recovery, paused startup resume, LidaClips, fullscreen autohide, vinyl mini-player, playlist-occurrence identity).
- R5: Verify with focused regressions, the non-Docker gate, hidden isolated rendering, then release ba.39 with nine assets and independent installer verification. Installed app untouched.

## Stages and reconciliation

| Stage | Status | Acceptance |
| --- | --- | --- |
| S1 Source | COMPLETE | R1 merged; R2 `artist-library-relations.ts` + detail page fallback; R3 fixes below. |
| S2 Verification | COMPLETE | Gate, types, lint, styles, secrets, hidden rendering pass (below). |
| S3 Delivery | COMPLETE | Commit/tag/push, package, publish, independent retrieval, cleanup. |

## QA findings

Fixed: (1) mini queue rebuilt every tick -> memoized rows keyed on queue changes; (2) whole mini-player re-rendered on timestamp -> progress/time moved into leaf components; (3) mini mode used `display:none` -> `content-visibility:hidden` keeps the main view mounted without painting; (4) mini artwork requested at an unbounded size -> 800 px; (5) visualizer `connect` identity changed each render -> stable callback; (6) tag editor leaked `blob:` artwork URLs -> revoked on change/unmount; (7) fullscreen queue tabs lacked `aria-pressed`, mini queue lacked a region role -> added; (8) artist "Top songs" showed an empty community table when only personal songs exist (Navidrome without Last.fm) -> falls back to the non-empty source.

Rejected with reason: persisting the playback timestamp every 500 ms feeds the fork's paused-startup resume and is cheap; autohide in any F11 fullscreen is the user's OLED burn-in specification (`2026-09-25-fullscreen-controls-autohide.md`). Mini queue virtualization was not needed once rows only rebuild on queue changes.

## Verification

Focused: `artist-library-relations` (3 tests: genre ranking, exclusion of self/collaborations/placeholders/server ids, primary-genre weighting), mini-player, mini-player-renderer, genre-context-menu, visualizer-capture-lifecycle, visualizer-system-audio. Full non-Docker gate: every node regression group and both native runtime fixtures passed; the gate's `corepack` steps were run directly (corepack absent from PATH): node/web typecheck, ESLint, Stylelint and secret scan pass.

Hidden isolated rendering (production build, isolated D: profile, non-focusable window): Taylor Davis shows genres Pop/Classical/Folk/Instrumental/Classical Crossover/Trance/Violin (derived from albums; the server has none) while its related artists come unchanged from the server's Deezer agent (Tina Guo, Taylor Davis & Lara de Wit, Lorne Balfe, ...), so the library fallback correctly stays off; IU shows server Red Velvet/SHINee topped up with K-Pop matches KISS OF LIFE, TUIDE, GOT the beat, and Top songs shows 45 personal songs. Mini-player enter, queue (current occurrence highlighted, seek/timestamps) and restore render correctly.

Harness lesson: `src/main/user-data-path.ts` re-points userData to the live `Feishin BasicAuth` directory and electron-store migrations key off `app.getVersion()`. A harness must intercept `app.setPath('userData')` and report the package version, and must compare the live config hash before and after each run. The first runs of this task lacked those guards and reset live config keys; they were restored from a pre-run snapshot the same minute.

## Delivery

Packaging used electron-builder 26.18.0. pnpm was unavailable on PATH, so module collection fell back to node_modules traversal; the resulting app.asar holds the same 342 top-level modules as installed ba.38, and the updater configuration is byte-identical (Darkaxt/feishin-basic-auth, cache `feishin-basic-auth-updater`). The artifact checker validated all nine assets. The packaged renderer, extracted from app.asar, rendered IU's genres, related artists and Top songs in the hidden isolated harness.

Source/tag commit `3cf11a825d4598e88d4dcba9353c0c6e864ad4d8` (parents: merge `80aea209c` of upstream `e36c5a958`) was pushed atomically with tag v1.15.1-ba.39. CodeQL run 44500442705 passed both analyses. [v1.15.1-ba.39](https://github.com/Darkaxt/feishin-basic-auth/releases/tag/v1.15.1-ba.39) was published as the normal latest release at 2026-11-19T09:54:49Z. All nine server-side sizes/SHA256 digests equal the candidate manifest. The x64 installer (187,821,879 bytes, SHA256 `194772f3a8e86731bbc42e4753763c0a230bf90f7b05e6b14113d0e7627788a5`) was retrieved independently from the public latest release and extracted with 7-Zip. Its app.asar, Feishin.exe, app-update.yml and ffmpeg.dll equal the candidate. FileVersion is 1.15.1-ba.39, and in Node-only mode the executable reports Electron 43.8.7. The installed app was not replaced.
