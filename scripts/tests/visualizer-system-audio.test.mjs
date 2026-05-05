import assert from 'node:assert/strict';
import test from 'node:test';

import {
    shouldAutoConnectSystemAudio,
    shouldOpenSystemAudioConsentPrompt,
} from '../../src/shared/utils/visualizer-system-audio.ts';

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
