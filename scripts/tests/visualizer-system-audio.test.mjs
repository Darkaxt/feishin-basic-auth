import assert from 'node:assert/strict';
import test from 'node:test';

import * as systemAudio from '../../src/shared/utils/visualizer-system-audio.ts';

const { shouldConnectVisualizerSystemAudio } = systemAudio;

test('system audio recovery watches output changes and capture termination', () => {
    assert.equal(typeof systemAudio.bindVisualizerSystemAudioRecovery, 'function');
    if (typeof systemAudio.bindVisualizerSystemAudioRecovery !== 'function') return;

    const mediaDevices = new EventTarget();
    const audioTrack = new EventTarget();
    const reasons = [];
    const cleanup = systemAudio.bindVisualizerSystemAudioRecovery({
        audioTrack,
        mediaDevices,
        onRecoveryNeeded: (reason) => reasons.push(reason),
    });

    mediaDevices.dispatchEvent(new Event('devicechange'));
    audioTrack.dispatchEvent(new Event('ended'));

    assert.deepEqual(reasons, ['devicechange', 'track-ended']);

    cleanup();
    mediaDevices.dispatchEvent(new Event('devicechange'));
    audioTrack.dispatchEvent(new Event('ended'));

    assert.deepEqual(reasons, ['devicechange', 'track-ended']);
});

test('system audio capture requests video only on macOS', () => {
    assert.equal(typeof systemAudio.getVisualizerDisplayMediaOptions, 'function');
    if (typeof systemAudio.getVisualizerDisplayMediaOptions !== 'function') return;

    assert.deepEqual(systemAudio.getVisualizerDisplayMediaOptions(false), {
        audio: {
            autoGainControl: false,
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
        },
        monitorTypeSurfaces: 'include',
        systemAudio: 'include',
        video: false,
        windowAudio: 'system',
    });
    assert.deepEqual(systemAudio.getVisualizerDisplayMediaOptions(true), {
        audio: {
            autoGainControl: false,
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
        },
        monitorTypeSurfaces: 'include',
        systemAudio: 'include',
        video: true,
        windowAudio: 'system',
    });
});

test('system audio waits for eligible visible capture and does not retry a denied activation', () => {
    const base = {
        canCaptureSystemAudio: true,
        hasVisualizerInput: false,
        isConnecting: false,
    };

    assert.equal(shouldConnectVisualizerSystemAudio(base), true);
    assert.equal(
        shouldConnectVisualizerSystemAudio({
            ...base,
            canCaptureSystemAudio: false,
        }),
        false,
    );
    assert.equal(
        shouldConnectVisualizerSystemAudio({
            ...base,
            hasAttemptedConnectionThisSession: true,
        }),
        false,
    );
});

test('system audio connects once without another app modal and reuses an existing input', () => {
    const base = {
        canCaptureSystemAudio: true,
        hasVisualizerInput: false,
        isConnecting: false,
    };

    assert.equal(shouldConnectVisualizerSystemAudio(base), true);
    assert.equal(
        shouldConnectVisualizerSystemAudio({
            ...base,
            hasAttemptedConnectionThisSession: true,
        }),
        false,
    );
    assert.equal(
        shouldConnectVisualizerSystemAudio({
            ...base,
            hasVisualizerInput: true,
        }),
        false,
    );
});
