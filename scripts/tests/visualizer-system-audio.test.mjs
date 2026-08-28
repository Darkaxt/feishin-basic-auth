import assert from 'node:assert/strict';
import test from 'node:test';

import * as systemAudio from '../../src/shared/utils/visualizer-system-audio.ts';

const { shouldAutoConnectSystemAudio, shouldOpenSystemAudioConsentPrompt } = systemAudio;

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
        audio: true,
        monitorTypeSurfaces: 'include',
        systemAudio: 'include',
        video: false,
        windowAudio: 'system',
    });
    assert.deepEqual(systemAudio.getVisualizerDisplayMediaOptions(true), {
        audio: true,
        monitorTypeSurfaces: 'include',
        systemAudio: 'include',
        video: true,
        windowAudio: 'system',
    });
});

test('system audio consent prompt opens only before a session decision', () => {
    const base = {
        canCaptureSystemAudio: true,
        hasVisualizerInput: false,
        isConnecting: false,
    };

    assert.equal(
        shouldOpenSystemAudioConsentPrompt({
            ...base,
            promptState: { consent: false, promptedThisSession: false },
        }),
        true,
    );
    assert.equal(
        shouldOpenSystemAudioConsentPrompt({
            ...base,
            promptState: { consent: false, promptedThisSession: true },
        }),
        false,
    );
    assert.equal(
        shouldOpenSystemAudioConsentPrompt({
            ...base,
            promptState: { consent: true, promptedThisSession: true },
        }),
        false,
    );
});

test('system audio auto-connects once after prior consent', () => {
    const base = {
        canCaptureSystemAudio: true,
        hasVisualizerInput: false,
        isConnecting: false,
        promptState: { consent: true, promptedThisSession: true },
    };

    assert.equal(shouldAutoConnectSystemAudio(base), true);
    assert.equal(
        shouldAutoConnectSystemAudio({
            ...base,
            hasAttemptedConnectionThisSession: true,
        }),
        false,
    );
    assert.equal(
        shouldAutoConnectSystemAudio({
            ...base,
            hasVisualizerInput: true,
        }),
        false,
    );
});
