import assert from 'node:assert/strict';
import test from 'node:test';

test('active app visualizer grants Electron 43 loopback without granting microphone/camera or foreign frames', async () => {
    const { isVisualizerCapturePermissionAllowed: allowed } =
        await import('../../src/main/features/core/visualizer/capture-permissions.ts');
    const base = {
        eligible: true,
        isMainFrame: true,
        mainFrameUrl: 'file:///C:/Feishin/out/renderer/index.html#/home',
        permission: 'media',
        requestingUrl: 'file:///C:/Feishin/out/renderer/index.html',
    };
    assert.equal(allowed({ ...base, mediaTypes: [] }), true);
    assert.equal(allowed(base), true);
    assert.equal(allowed({ ...base, mediaTypes: ['audio'], permission: 'display-capture' }), true);
    assert.equal(allowed({ ...base, mediaTypes: ['audio'] }), false);
    assert.equal(allowed({ ...base, mediaType: 'audio' }), false);
    assert.equal(allowed({ ...base, mediaTypes: ['video'] }), false);
    assert.equal(allowed({ ...base, isMainFrame: false }), false);
    assert.equal(allowed({ ...base, eligible: false }), false);
    assert.equal(allowed({ ...base, requestingUrl: 'https://example.com/' }), false);
    assert.equal(allowed({ ...base, requestingUrl: 'file:///C:/other.html' }), false);
    assert.equal(allowed({ ...base, permission: 'geolocation' }), false);
});
