# Visualizer recovery after audio output reconfiguration

Authority: the user reports a flat visualizer during MPV playback. Fix and deliver under standing authorization. Preserve the running user's playback during investigation, use hidden test windows, and never invoke Docker.

## Requirements and acceptance

- R1: When the current MPV audio output is reconfigured, reacquire the active local visualizer's loopback stream and analysis context. Use MPV's native `audio-reconfig` event, including when browser `devicechange` is unavailable. Do not grant microphone/camera permissions or add consent prompts.
- R2: Serialize recovery against capture acquisition/context resume. An output change during an acquisition invalidates that acquisition and schedules exactly one replacement after it settles. Closing/unmounting cancels pending recovery. Inactive/denied surfaces and stale/temporary MPV instances cannot initiate capture.
- R3: Recovery must not issue playback, queue, volume, mute or device commands. Preserve the web-player context. Demonstrate a live captured signal reaching the real AudioMotion component, replacement of its old stream/context, and continued analysis after replacement.
- R4: Preserve BasicAuth, managed MPV, paused startup, clips, fullscreen and updater/profile identity. Pass focused regressions, the non-Docker source gate and production build/package checks. Publish and independently verify the normal Windows release and deploy locally with settings/queue preservation and hidden packaged verification.

## Evidence and design

Installed ba31 main PID 42012 and MPV PID 48580 were preserved throughout investigation. Windows shows MPV active on ADI-2 DAC while Feishin audio service PID 48576 remains active on BTD 700; both have inactive sessions on the other endpoint. Read-only audio-policy queries report no per-application endpoint override. The app logged a live system-audio track at 20:02:39 UTC and no subsequent recovery. A live track alone does not prove a signal.

A separate hidden Electron 43.7.0 capture of the current output measured peak block RMS 0.222696 and peak amplitude 0.661390 at 48 kHz. The unmodified production AudioMotion component, bundled with real React/AudioMotion and an isolated loopback input, measured -32.08 dB peak FFT input and continued drawing through a React rerender. Its sole canvas was removed on unmount. This rules out a universal capture/AudioMotion failure, but does not measure the existing installed renderer's private stream.

The production capture hook recovers only on browser `devicechange` and track `ended`. Node-MPV's native event dispatcher discards `audio-reconfig`; Feishin does not forward it. Chromium also gates device-change delivery through audio-capture permission, which this fork correctly denies for microphones. Therefore browser events alone are not a reliable output-lifecycle boundary. Forward MPV's actual output reconfiguration through the existing main/preload visualizer API, retaining current-instance/generation guards. Keep the existing browser and track recovery.

Scratch: E:/Temp/feishin-visualizer-20261105 contains disposable orchestration. D:/Temp/feishin-visualizer-20261105 contains native Electron fixtures/profiles and scratch because native/small-file I/O requires D:. Existing checkout-bound out/dist are registered with transactional cleanup 1997842e04221fbb62532ba4a41709ec. No new dependencies or runtime downloads are required.

## Stages and reconciliation

1. Output recovery and integrated verification - COMPLETE. R1-R3 passed. The native MPV IPC event reaches the actual preload subscription and production capture hook; old streams/contexts end, a replacement runs and actual AudioMotion analysis continues. Capture changes during acquisition coalesce, stale failures cannot cancel recovery, closing cancels pending work, and denied/inactive surfaces cannot retry from native events. The existing web context is preserved. Both type checks, all fork regressions, native fullscreen gate, whole-source ESLint, styles and secret scan passed. The source gate initially exposed missing external-library typing for its verified IPC emitter; the narrow type assertion fixed that and the remaining gate commands passed without rerunning unchanged regressions. No stage blockers remain.
2. Final release and local delivery - ACTIVE. Production Electron/remote builds, all nine Windows artifacts, updater validation and actual packaged runtime verification passed. Internal advancement blockers: publication, independent release retrieval, local installation/startup verification, original player/window restoration and spent-artifact cleanup remain to be completed.

No tracked deferrals.

## Integrated verification

The user confirmed switching from BTD 700 to ADI-2 DAC after opening Feishin. A hidden Electron 43.7.0 fixture used the real production capture hook, React/AudioMotion, actual preload context bridge and native MPV IPC emitter. Its separate MPV used null audio output; it did not send commands to the user's MPV. A native output-reconfiguration event replaced the first stream/context. Before and after FFT peaks were -25.13 and -27.40 dB; old context closed/track ended, new context running/track live, exactly one canvas remained, and unmount removed the canvas/stopped the final track. Native visibility stayed false with opacity zero. The fixture exited with its owned MPV.

This test also exposed conflicting graph ownership: capture cleanup disconnected AudioMotion's edge before AudioMotion could destroy it, causing its destroy method to throw before canvas removal. Capture now owns stream/context release; consumers own their input edges. AudioMotion uses a stable host ref and effect-local instance cleanup. The lifecycle regression failed before this fix. Native verification then proved canvas count one after recovery and zero on unmount. Review at stage closure found no further required refactoring or general infrastructure need.

An intermediate native fixture caught an IPC unsubscribe return-value defect before release: returning ipcRenderer through the context bridge crashed that fixture renderer. The callback now returns void, with a regression assertion and passing native context-bridge verification. Earlier incomplete fixture runs are not counted as acceptance evidence.

## Packaged candidate

Version 1.15.1-ba.32 uses the existing nine-asset Windows release set. Production Electron and remote builds passed, followed by x64/ARM64/universal packaging and updater normalization/validation. The emitted native event forwarder and complete preload API were executed from app.asar; scoped forwarding, current-instance suppression and listener disposal passed. Main/preload/renderer source maps exactly match the verified changed sources. Candidate x64 executable SHA256: 7d08a2690e07e29295702a36cd11803e022607ba12b91e529226d799b1f63b4e. Candidate app.asar SHA256: 9a28647c01fe29dcac75b3202cf4a4d4fb81b84419fd59378d1830f7f6ef5bf6. PE FileVersion is 1.15.1-ba.32; its certificate table is empty, matching the established unsigned channel.

The original installed process 42012 and its children exited normally before the candidate test. The actual packaged candidate ran as PID 61036 with every owned Win32 window confirmed hidden. Startup was paused. An explicit Play button click produced real analyser input at -36.54 dB; a runtime-only MPV sample-rate reconfiguration exercised the actual main/preload/hook recovery path, after which input measured -36.60 dB. Old context closed, new context ran, superseded tracks ended, the final track remained live, and one canvas remained. Runtime sample-rate override was reset, an actual Pause click succeeded, and the candidate/owned MPV exited normally. No global audio-device, mute or volume setting changed. Hidden windows draw slowly on this host; the test waited for actual FFT calls, without a cancellation timeout.

The first packaged observation used an unsuitable readiness signal (playback-time events while startup is paused), and a subsequent observation asserted MPV readiness before initialization finished. Those incomplete observations were cancelled and their owned apps closed normally. The corrected test observes actual MPV readiness on app lifecycle log changes and closes its CDP transport on errors. Only the completed PID 61036 result above establishes packaged acceptance.

Original renderer window preferences, main window settings and exact persisted player/queue values are held privately in the task's D: scratch for restoration after installed verification. Temporary main/renderer start-minimized values are synchronized to true for hidden testing. The user profile is not an isolated --user-data-dir clone. No visible launch was used.
