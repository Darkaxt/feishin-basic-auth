# November 19: in-app updater (ba.41)

Authority: the user's 2026-11-19 request: "Can we implement a proper updater? The current version notification just opens a link to github. Please deploy the updated binary automatically when ready". That message authorizes replacing the installed binary with the verified ba.41 build.

## Requirements

- R1: Updates download in the background and install from inside the app, without visiting GitHub.
- R2: The user chooses when to restart. A downloaded update otherwise installs silently on quit.
- R3: The updater only follows the fork's own releases and never downgrades.
- R4: Preserve the fork invariants in `docs/fork-maintenance.md`. Keep a GitHub link fallback when the in-app updater is unavailable (web build, updates disabled, or a failed check).
- R5: Add a regression test that fails on the old behaviour. Release ba.41 with nine assets, verify the published installer independently, then install it on this machine.

## Root cause

electron-updater was already bundled, but it failed on every launch with `ERR_UPDATER_NO_PUBLISHED_VERSIONS` (live `main.log`, 2026-11-07 and 2026-11-19). The latest channel set `allowPrerelease = true`. In that mode, the GitHub provider only accepts tags whose prerelease label equals the channel (`latest`, `alpha` or `beta`). Every fork tag is `-ba.N`, so none matched. The only visible update path left was the renderer's GitHub API poll, which renders a link.

Two more problems:
- The Windows path used `checkForUpdatesAndNotify`, which has no in-app "restart now" step.
- The release-channel picker offered upstream's alpha channel (the jeffvli S3 nightly bucket). Choosing it would replace the fork with upstream builds. The beta channel looked for a `beta.yml` the fork never publishes.

## Change

- `src/main/fork-updater.ts` replaces the upstream updater block.
  - It uses the fork's GitHub "latest" release with `allowPrerelease = false`, which resolves `/releases/latest`. It sets `allowDowngrade = false` after the channel, because the channel setter turns downgrades back on.
  - It downloads automatically and installs on quit.
  - It checks at startup and every 6 hours.
  - It sends `updater-status` (checking, downloading with percent, downloaded, error) to the renderer.
- `updater-install` sets `exitFromTray` and calls `quitAndInstall(true, true)`. That is a silent install, then the app relaunches; exit-to-tray cannot cancel it.
- In the renderer:
  - The title-bar/settings button shows the download progress, then "Restart to update".
  - A one-time-per-version dialog offers View more, Later and Restart to update.
  - The GitHub link remains the fallback.
- The release-channel picker was removed.

## Verification

- `fork-updater.test.mjs` drives electron-updater's real `GitHubProvider` with a fixture release feed.
  - With the fork options it resolves `v1.15.1-ba.40` from `latest.yml`.
  - With the old options it throws `ERR_UPDATER_NO_PUBLISHED_VERSIONS`.
  - It also asserts the install wiring and that no upstream channel is reachable.
- The full non-Docker gate (all node suites), both type checks, eslint, stylelint and the secret scan pass.
- Hidden end-to-end run against the real GitHub release, using the built app with a faked current version of `1.15.1-ba.39`:
  - Isolation: its own profile and log, a blocked userData re-point, its own updater cache and a stubbed installer.
  - It went checking → downloading `1.15.1-ba.40` → downloaded in about 20 s, and showed the "ready to install" dialog.
  - "Restart to update" invoked the installer step with `isSilent: true, isForceRunAfter: true`.
  - The live config hash and live log size were unchanged. The harness cache and profile were removed.
- Limitation: the real installer launched by `quitAndInstall` runs for the first time on the next release after ba.41. ba.38 to ba.40 cannot self-update because of the bug above, so ba.41 is installed directly.

## Delivery

- Released [v1.15.1-ba.41](https://github.com/Darkaxt/feishin-basic-auth/releases/tag/v1.15.1-ba.41) at 2026-11-19T17:22:42Z (latest, not draft or prerelease) from commit `2888cca15`. The tag was pushed atomically with `development`. CodeQL push run 44576177741 succeeded.
- All nine assets' server SHA-256 digests match the local candidates. The bundled package set equals ba.40's (322 packages, 18,366 asar entries).
- Independently downloaded x64 installer: 187820412 bytes, SHA-256 `f2702411562f3b4f244248e90805d108003a73c16678502f2e3db7e7908fd98a`.
  - Its `app.asar`, `Feishin.exe`, `app-update.yml` and `ffmpeg.dll` are byte-identical to the build.
  - FileVersion is 1.15.1-ba.41, and Electron is 43.8.7.
- Deployed locally, as authorized:
  - The running ba.38 was paused, so it was closed gracefully (window close; exit-to-tray off).
  - The verified installer then ran with `/S --force-run` and exited with 0. It installed into the fork's recorded location (`HKCU\Software\0dadfe7c-…` → `Programs\Feishin BasicAuth`).
  - The installed `app.asar` matches the release. The uninstall entry and FileVersion show 1.15.1-ba.41. The separate upstream Feishin 1.17.0 install is untouched.
  - The app relaunched paused on the same track (213 / 459).
  - Its first updater check logged "Update for version 1.15.1-ba.41 is not available (latest version: 1.15.1-ba.41)" instead of `ERR_UPDATER_NO_PUBLISHED_VERSIONS`.
