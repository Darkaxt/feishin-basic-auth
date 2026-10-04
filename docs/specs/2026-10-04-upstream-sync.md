# October upstream integration

Authorized by the user's request to proceed after the maintenance blocker.

## Required outcome

- Verify local commit `07f3c3e70` using the non-Docker source gate and Electron production build before integration.
- Merge upstream development from `b34ffda29` through `7e1bf98dc`, preserving BasicAuth and updater identity, startup restoration, MPV recovery and queue synchronization, LidaClips, fullscreen dithering and layout, and visualizer behavior.
- Reconcile upstream seek events and audiobook restoration with existing playback and clip handoff contracts.
- Pass the non-Docker source gate, relevant regressions, and Electron production build on the integrated source.
- Update the sync marker, commit and push development; remove expendable generated output transactionally.
- No Docker, packaging, release, or installed-app changes.

## Stages

1. Local candidate verification - COMPLETE. Acceptance: source gate and Electron build succeed on `07f3c3e70`. Both commands exited successfully on the unchanged local candidate.
2. Integration and verification - COMPLETE. Acceptance: upstream ancestry and fork behavior preserved, focused and source gates pass, production build succeeds. Conflicts retain the desktop player default and hydrated metadata refresh, and retire the removed stored-seek API. Unavailable-song recovery retains timestamp reset and queue synchronization. Repeated seek events and subscriber cleanup have focused regression coverage.
3. Delivery - COMPLETE. Acceptance: sync marker correct, verified changes committed and pushed, worktree clean, generated output removed. Merge `e6f5d319a` was pushed successfully; upstream has zero missing commits. Cleanup transaction `d491227af0bc975b50b1dccf86b144a3` removed all registered output (52,329,302 bytes) with no residuals.

## Verification evidence

- Complete non-Docker gate behavioral tests and both TypeScript checks passed on integrated code. Lint initially found formatting in the new tests; ESLint fixed it, the affected tests passed again, and full code/style lint and secret scan passed.
- `pnpm run build:electron` exited successfully for the local candidate and the integrated candidate.
- Identity, BasicAuth injection, LidaClips, and fullscreen dithering are preserved; existing fork regressions pass.
- Relevant open upstream PRs remain unmerged: #2550 queue clearing, #2549 session retries, and #2543 API-key authentication. These touch queue and authentication boundaries and need fork-preserving review when merged upstream.
- Verification is source and build level; this task does not claim installed-app playback or audiobook runtime validation.

Blockers: none. Tracked deferrals: none.
