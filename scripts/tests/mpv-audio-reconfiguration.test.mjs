import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

import { bindMpvAudioReconfiguration } from '../../src/main/features/core/player/mpv-audio-reconfiguration.ts';

test('native MPV audio reconfiguration reaches the preload subscription and releases both listeners', () => {
    const socket = new EventEmitter();
    const ipcRenderer = new EventEmitter();
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(
            readFileSync(new URL('../../src/preload/visualizer.ts', import.meta.url), 'utf8'),
            { compilerOptions: { module: ts.ModuleKind.CommonJS } },
        ).outputText,
        { exports, require: () => ({ ipcRenderer }) },
    );
    let active = true;
    let received = 0;
    const unsubscribe = exports.visualizer.onAudioReconfigured(() => received++);
    const unbind = bindMpvAudioReconfiguration(
        socket,
        () => active,
        () => ipcRenderer.emit('visualizer-audio-reconfigured'),
    );
    socket.emit('message', { event: 'audio-reconfig' });
    assert.equal(received, 1);
    socket.emit('message', { event: 'playback-restart' });
    socket.emit('message', { data: 100, event: 'property-change', name: 'volume' });
    assert.equal(received, 1);
    active = false;
    socket.emit('message', { event: 'audio-reconfig' });
    assert.equal(received, 1, 'stale or temporary MPV must not initiate capture');
    active = true;
    assert.equal(unsubscribe(), undefined, 'the bridge must not return ipcRenderer to the page');
    socket.emit('message', { event: 'audio-reconfig' });
    assert.equal(received, 1);
    unbind();
    assert.equal(socket.listenerCount('message'), 0);
    assert.equal(ipcRenderer.listenerCount('visualizer-audio-reconfigured'), 0);
});
