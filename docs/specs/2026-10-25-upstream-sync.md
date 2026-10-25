# October 25 upstream maintenance

Authorization: scheduled source-only maintenance. Explicitly no Docker, release artifacts/publication, deployment, installed-binary replacement or unmerged PR integration.

## Required outcome

- Integrate six upstream commits from 36f8e1839 through efaed0c57, including LAN/font permissions, codec display fixes and translations.
- Preserve BasicAuth and updater identity, MPV queue/recovery and startup-resume, LidaClips, fullscreen and fork regressions.
- Pass focused permission regressions, complete existing non-Docker gate (type checks, lint and secret scan included) and production Electron build.
- Update sync marker, commit/push verified development, verify remote ancestry/clean state, remove exact task output transactionally.

## Stages

1. Integration and verification - COMPLETE. Initial branch clean; origin divergence 0/0, upstream divergence 163/6. Acceptance: reviewed merge preserves fork contracts; focused and required source/build checks pass. Conflict-free merge adds only permission handlers, codec presentation and translations. Focused permission regression executes actual registered callbacks, allowing LAN/font permissions and denying tested camera/microphone/geolocation/notification requests. Existing fork regression gate, Node/web type checks, ESLint, Stylelint, secret scan and production Electron build all passed. No installed-app/LAN runtime validation is claimed.
2. Delivery and cleanup - COMPLETE. Acceptance: correct marker, verified integration pushed and origin-aligned, upstream fully included, generated output removed. Merge 5de12b3d1316211a4c5851549dac93668293e376 pushed successfully; live origin matched local development and upstream divergence became 164/0 before this evidence-only closure. Marker records efaed0c5778a4221c297529c7ca69f2c825ca730. Cleanup 4ba6c8616558095dc8ea5d49280b6837 applied successfully, deleting 64,902,918 bytes; both exact roots are absent. No Docker, release artifacts, publication or installed-binary changes. No required blockers or tracked deferrals remain.

Closure assessment: no conflicting state ownership, duplicated business logic or new workaround found in this bounded integration. No refactoring scope added; reuse at final reconciliation.

## Parent PR risks

- #2642 proposes suspend/resume MPV recovery and duplicate-resume handling; touches fork recovery paths and needs careful integration if merged upstream.
- #2651 proposes Electron 43.8.3 for reported eMudhra CA distrust. This is an open PR claim, not independently validated or included in this run.
- #2549 session retries and #2550 queue clearing remain unmerged.

## Execution checkpoint

Use D:/Temp/feishin-sync-20261025/verify.ps1 for source/build checks; routes child TEMP/TMP to exact task scratch. out is unavoidable project build output. Launcher preflight retained privately in task scratch. Use installed transactional-cleanup for exact roots; no ad hoc deletion. Task-owned inspect-cleanup.ps1 validates the helper's signed manifest, not deletion itself.

Tracked deferrals: none.
