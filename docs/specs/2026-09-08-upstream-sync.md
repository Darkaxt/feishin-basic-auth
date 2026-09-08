# Upstream sync, 2026-09-08

Authorization: already_authorized by the request to implement the heartbeat recommendations.

## Requirements

- R1: Merge parent development at af6542ac4f6f0ed5aa6f5c8ce602201970be8821 (20 commits) into development without rewriting fork history.
- R2: Preserve proxy BasicAuth and profile identity, LidaClips secret reuse and sticky/ambient playback, fullscreen tabs, visualizer capture, vinyl artwork, genre playback, and MPV lifecycle behavior.
- R3: Verify the upstream resume/seek and MPV switching fixes alongside fork regression checks, TypeScript, ESLint, and styles. Add focused coverage where integration changes behavior.
- R4: Assess open PR #2421 against LidaClips without integrating an unmerged alternative video implementation.
- R5: Update the upstream sync marker, commit the verified merge, and sync development to origin. No version bump, release artifacts, release, or installed-app change is part of this task.

## Stages and reconciliation

1. Inspect and merge (R1, R2): complete. Resolved six conflicting paths, retained queue synchronization and song refresh, included clips in desktop panel predicates, and retained translated export formatting and edited form options.
2. Verify and remediate (R2, R3): complete. Six focused tests pass. The lyrics event regression reproduced the missing subscription; added subscription and matching cleanup. Full integrated gate passes with 95 tests, both typechecks, ESLint, stylelint, and secret scan.
3. Document and integrate (R4, R5): video PR assessment and sync marker complete. Verified source is ready for the merge commit and origin push; delivery ancestry and clean-status evidence are reported with the final commit.

## Video PR assessment

Parent PR #2421 is open at e4cc798f59fbc9e60a1bae4e3b27d1da47b0efd5. It proposes muted video driven by timestamp.store, a persistent video surface for picture-in-picture, main-process range streaming, and worker-based audio fingerprint alignment. These overlap our ambient-video synchronization and stream boundary. Its yt-dlp/ffmpeg download and matching pipeline would duplicate the in-house LidaClips service. Keep the existing canonical artist/album/track lookup and credentials contract. Reassess synchronization and persistent-surface changes if the PR merges; do not add a second provider or matching engine during this sync.

## Verification evidence

- `node scripts/run-basic-auth-release-gates.mjs`: exit 0; 95 tests pass, zero failures, plus node/web (including remote) TypeScript, ESLint, stylelint, and secret scan.
- `corepack pnpm run lint:staged`: exit 0.
- `git diff --cached --check`: exit 0; all merge conflicts resolved.
- Focused tests cover MPV initialization/control readiness and queued resume, canceled startup, lyrics event delivery/cleanup, translated LRC and edited export options, song-change seek reset, and desktop CLIPS panel visibility.
- Profile identity, package naming, dependencies, LidaClips service code, and visualizer capture code are unchanged by the merge. Existing fork regressions cover proxy credentials, stream Range forwarding, sticky/ambient clip decisions, vinyl artwork, genre playback, and visualizer recovery.
- No implementation blockers or required deferrals remain. Live Windows audio and installed-app verification are not claimed by source regression tests. No release or deployment was requested.
