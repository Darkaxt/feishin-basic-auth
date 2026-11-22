# November 22 upstream maintenance (ba.43)

Authority: the weekly Reframe task `feishin-upstream-sync-release-weekly` and the standing Codex maintenance brief. No Docker, no unmerged parent PRs, no installer runs or live profile changes; the installed app updates itself through the in-app updater.

## Requirements

- R1: Integrate upstream `e36c5a9589162b9f9f2eb277cff97882e448540d..760b7829e3c2d9c3811ac46abc36e72f30f6d42d` (one commit, #2718 "chore: bump taglib"). Initial divergence: fork/origin 0/0, fork/upstream 201/1.
- R2: Preserve the fork invariants in `docs/fork-maintenance.md` and every fork feature recorded in `docs/specs`.
- R3: taglib-wasm moves 1.8.3 to 2.4.1 (major). Prove the tag editor's taglib calls still work in the Electron 43 runtime, from source and from the packaged app.
- R4: Non-Docker source gate, node/web types, ESLint, Stylelint, secret scan, production Electron and remote builds.
- R5: Release v1.15.1-ba.43 as Latest with nine assets, verify the published installer independently, and update `docs/upstream-sync-state.json`.
- R6: Clean task scratch and `out`/`dist` through transactional-cleanup.

## Stages

| Stage | Status | Acceptance |
| --- | --- | --- |
| S1 Integration | COMPLETE | Clean merge (`package.json`, `pnpm-lock.yaml` only); `pnpm install --frozen-lockfile` (pnpm 11.5.2) installed taglib-wasm 2.4.1 and rebuilt native deps for Electron 43.8.7. |
| S2 Verification | COMPLETE | See below. |
| S3 Delivery | ACTIVE | Package, publish, verify, clean up. |

## Verification

- `src/main/features/core/tag-editor/taglib-service.ts` is unchanged by upstream and type-checks against the 2.4.1 typings.
- Runtime check under Electron 43.8.7 (Node 24.22.1) with taglib-wasm 2.4.1 on generated MP3, FLAC, M4A and OGG files: `TagLib.initialize`, `edit` with `properties`/`setProperties` (camelCase known keys, ALL_CAPS custom key, multivalue artist, removal by empty array), `setLyrics`, `removePictures`/`addPicture`, then `open` with `properties`, `getLyrics`, `getPictures` and `dispose` all round-trip. Picture removal is confirmed on reopen.
- Release gate: all 28 test groups pass up to the expected corepack stop; node and web `tsc`, ESLint, Stylelint and the secret scan pass when run directly. All runs went through the Coordinator pipeline gate.
- The change is main-process only, so no rendered UI check is required.

## Delivery

Pending.
