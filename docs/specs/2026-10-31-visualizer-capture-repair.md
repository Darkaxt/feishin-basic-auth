# Visualizer capture repair

Authority: the user reports broken visualization and rejects the extra app-level capture popup. They subsequently identified BetterTrumpet mute/icon behavior as the explanation for the apparent playback silence and explicitly retained the visualizer defect as the active issue. Fix, verify, release and deploy under existing authorization. No BetterTrumpet changes, visible app launch, desktop takeover or Docker.

## Requirements

- R1: Opening an MPV visualizer surface establishes its system-audio input without an additional Feishin consent modal. Preserve required OS permission controls. Do not grant arbitrary screen, microphone or camera access: only the active local visualizer in the app's own main frame may receive its loopback/display-capture permission. Preserve existing LAN/font permissions and denial of unrelated requests.
- R2: Acknowledge main-process visualizer eligibility before requesting capture; no arbitrary delays/retries. One attempt per activation, event-driven recovery after a lost stream/device change, and cancellation/cleanup when the surface closes or the component unmounts. Capture failure remains recoverable and must not silently disable saved visualizer preferences or navigate the user elsewhere.
- R3: Visualization must not alter MPV playback, queue, output volume/mute, audio devices, or BetterTrumpet. Verify a real loopback track and analysis input, not merely a successful mocked API call. Preserve web-player audio contexts during visualizer cleanup.
- R4: Preserve managed MPV and overrides, BasicAuth, paused startup, LidaClips, fullscreen and updater/profile identity. Deliver verified normal ba28 Windows assets and local installation with hidden runtime verification and profile preservation. Clean spent scratch after its last consumer.

## Evidence and decisions

The live ba27 process has managed MPV running and unmuted; this alone did not prove audible output, and the user correctly objected to treating it as such. BetterTrumpet explains that separate mute observation. The actual visualizer log reports NotAllowedError / Permission denied.

A hidden Electron 43.7.0 reproduction using the same loopback request and current deny-by-default permission policy reproduced that exact error. The runtime requests `media` with an empty mediaTypes array, then checks `media` without a camera/microphone mediaType. Allowing that scoped request reaches the display handler and returns a live audio-only loopback track. The existing main permission allowlist permits only LAN/fonts and denies this request. Electron documentation also defines the newer display-capture permission; support it under the same ownership/visibility guard. Keep Windows audio-only capture, which the real reproduction verified; no screen stream is needed on this host.

The redundant app modal was not an OS requirement. Remove its consent state and forced surface closure. Use the existing visualizer state owner and preload API, with an acknowledged visibility update before acquisition.

Disposable orchestration: E:/Temp/feishin-ba28. Native Electron profiles, fixtures and build/packaging scratch: D:/Temp/feishin-ba28 for native/small-file I/O. Existing checkout-bound out/dist paths remain registered for cleanup. Retain the installed managed runtime at D:/Tools/Feishin/mpv-runtime.

## Stages

1. Capture repair and integrated verification - COMPLETE. Owns R1-R3 and preservation checks from R4. Scoped permission, acknowledged IPC and modal-free bridge are integrated. Regression checks cover inactive/foreign/microphone/camera denial, stale acknowledgements, unmount with pending capture, closure during context resume and preservation of the web-player context. Both late-capture regressions failed before generation cancellation and passed afterward. Adjacent playback/clip/permission tests, both type checks and affected-source lint passed. Hidden Electron 43.7.0 using the production permission predicate reproduced denial before eligibility, then captured a live audio-only track with 49,152 analysed samples at 48 kHz and peak block RMS 0.026364. No MPV commands or device/volume/mute changes were made by the capture test.
2. Release and local delivery - ACTIVE. Owns remaining R4. Acceptance: complete non-Docker gate, production builds, Windows packaging/updater validation, exact source commit/tag/push, normal release and independent installer/payload checks, preserved local profile and hidden installed visualizer verification, completed cleanup and remote read-back. Internal advancement blocker: remaining release and installed verification work; resolve here.

No tracked deferrals. Existing updater-feed warnings, BetterTrumpet behavior and unrelated upstream changes remain outside this repair.

## Delivery verification

The complete non-Docker gate passed for the ba28 source: fork behavior regressions, scoped capture and lifecycle checks, both type checks, whole-source ESLint, styles and secret scan. Recovery stays in the capture hook, without resetting the bridge's attempt flag and accidentally requesting another capture after a recovery failure. Production Electron/remote builds, x64/ARM64/universal Windows packaging and updater validation passed. No Docker was invoked.

Local ba28 installation passed the closed-profile hash comparison. The installed app.asar SHA256 is b91c5d8210760e6408dbb8c3a310f85bd18b76634ef270f03231a500aada8ebb and FileVersion/embedded identity are 1.15.1-ba.28. The executable remains unsigned, matching the established release procedure.

Hidden installed verification used main PID 37668, with its native window confirmed not visible. Managed MPV initialized from the existing D:/Tools runtime under a clean system PATH; startup was paused, queue count two, volume 100, mute off and device auto. The restored visualizer connected to a live system-audio track without the removed consent modal. Actual Up next and Visualizer button clicks closed the old context/stopped its track and acquired a new live track. Explicit Play created a canvas and the real visualizer called getFloatFrequencyData with 8,192 entries on a running context. The product's visualizer input yielded 49,152 samples at 48 kHz with peak block RMS 0.04015456. The test explicitly paused playback afterward; fullscreen preferences were unchanged.

The temporary main-process-only start-minimized test setting triggered the existing renderer/main settings warning. The user restarted the app. Read-back of that new instance confirmed both start-minimized values false, no settings warning and paused playback; original bounds/maximized/fullscreen settings also matched. No visible launch or restart was initiated by the test. The user-restarted instance inherited D:/Temp/feishin-ba28/scratch as TEMP/TMP; preserve that exact active consumer until it exits, and clean independent spent artifacts separately. Do not terminate or take over the user's new instance to reclaim scratch.
