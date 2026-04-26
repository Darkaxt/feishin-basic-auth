# Feishin BasicAuth Fork Maintenance

This fork carries a small reverse-proxy BasicAuth patch on top of upstream
`jeffvli/feishin:development`. Keep the patch narrow and reimplement these
invariants if upstream moves code around.

## Patch invariants

- Persist only `proxyAuth.enabled`, `proxyAuth.type`, and `proxyAuth.username` in the server list.
- Store proxy BasicAuth passwords only in Electron `safeStorage` using
  `proxy-basic-auth:<serverId>`.
- Strip URL userinfo credentials from server URLs before saving; migrate those credentials into the
  proxy BasicAuth fields instead.
- Sync configured server origins to the Electron main process and inject
  `Authorization: Basic ...` only for those origins.
- Do not log, persist in Zustand, or commit proxy passwords or generated Basic headers.
- Do not overwrite an existing `Authorization` request header. This keeps Jellyfin bearer-token
  traffic intact; Navidrome and Subsonic use non-Authorization app auth paths.
- Use URL credentials only as an MPV/direct external media fallback, and only after reading the
  password from `safeStorage`.
- Point package identity, app id, and updater metadata at `Darkaxt/feishin-basic-auth`.

## Current patch map

- Shared helpers: `src/shared/utils/proxy-auth.ts`
- Server metadata types: `src/shared/types/domain-types.ts`, `src/shared/types/types.ts`
- Main-process header injection: `src/main/features/core/proxy-auth/index.ts`
- Renderer sync hook: `src/renderer/hooks/use-sync-proxy-auth-to-main.ts`
- Add/edit server UI and safeStorage handling:
  `src/renderer/features/servers/components/add-server-form.tsx`,
  `src/renderer/features/servers/components/edit-server-form.tsx`
- MPV fallback: `src/renderer/api/subsonic/subsonic-controller.ts`
- Fork identity/updater: `package.json`, `electron-builder*.yml`, `src/main/index.ts`

## Autonomous sync procedure

1. Fetch `upstream development` and compare it to
   `docs/upstream-sync-state.json:lastSyncedUpstreamSha`.
2. If unchanged, run the lightweight checks and exit.
3. If changed, create a sync branch from the latest upstream development branch.
4. Reapply or reimplement the BasicAuth patch using the invariants above.
5. Run the release gates. Do not publish if any gate is red.
6. If green, update `docs/upstream-sync-state.json`, set the package version to
   `<upstream-version>-ba.<run>`, merge to the fork development branch, push, and publish the
   Windows release to GitHub Releases.
7. If repair attempts are exhausted, push diagnostics/artifacts only. Keep the last good release.

## Release gates

Use `node scripts/run-basic-auth-release-gates.mjs --full` for release candidates. It runs:

- BasicAuth helper tests.
- TypeScript node and web typechecks.
- ESLint and stylelint.
- Secret-redaction scan.
- Traefik BasicAuth smoke harness.
- Windows package build.

The smoke harness lives in `scripts/basic-auth-smoke.mjs` and starts Navidrome behind Traefik
BasicAuth. It verifies the protected proxy path before client packaging. If the client code or
Electron networking changes materially, extend this harness rather than weakening the gate.
