/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-empty-function -- JavaScript hook fixtures implement only the observed native boundary. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

import * as systemAudio from '../../src/shared/utils/visualizer-system-audio.ts';

function harness(initialAudio) {
    const slots = [];
    let cursor = 0;
    let webAudio = initialAudio;
    let resolveCapture;
    let rejectCapture;
    let resolveResume;
    let stopped = 0;
    let closed = 0;
    let inputs = 0;
    let captures = 0;
    let sourceDisconnections = 0;
    const audioEvents = new EventTarget();
    const track = new EventTarget();
    track.stop = () => stopped++;
    const stream = {
        getAudioTracks: () => [track],
        getTracks: () => [track],
        getVideoTracks: () => [],
    };
    const pending = [];
    const react = {
        useCallback: (fn, deps) => {
            const index = cursor++;
            const previous = slots[index];
            if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
                slots[index] = { deps, value: fn };
            }
            return slots[index].value;
        },
        useEffect: (fn, deps) => {
            const index = cursor++;
            const previous = slots[index];
            if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
                pending.push(() => {
                    previous?.cleanup?.();
                    slots[index] = { cleanup: fn(), deps };
                });
            }
        },
        useRef: (value) => (slots[cursor++] ??= { current: value }),
        useState: (value) => {
            const index = cursor++;
            slots[index] ??= { value };
            return [
                slots[index].value,
                (next) => {
                    slots[index].value =
                        typeof next === 'function' ? next(slots[index].value) : next;
                },
            ];
        },
    };
    class AudioContext {
        state = 'running';
        close() {
            closed++;
            return Promise.resolve();
        }
        createMediaStreamSource() {
            return {
                disconnect() {
                    sourceDisconnections++;
                },
            };
        }
        resume() {
            return new Promise((resolve) => {
                resolveResume = resolve;
            });
        }
    }
    const setWebAudio = (next) => {
        webAudio = next;
        if (next?.visualizerInputs?.length) inputs++;
    };
    const mocks = {
        '/@/i18n/i18n': { default: { t: (key) => key } },
        '/@/renderer/features/player/hooks/use-webaudio': {
            useWebAudio: () => ({
                setWebAudio,
                webAudio,
            }),
        },
        '/@/renderer/store/settings.store': { usePlaybackType: () => 'local' },
        '/@/renderer/utils/logger': { logger: { info() {}, warn() {} } },
        '/@/shared/components/toast/toast': { toast: { error() {} } },
        '/@/shared/types/types': { PlayerType: { LOCAL: 'local', WEB: 'web' } },
        '/@/shared/utils/visualizer-system-audio': systemAudio,
        'is-electron': () => true,
        react,
    };
    const source = readFileSync(
        new URL(
            '../../src/renderer/features/player/hooks/use-visualizer-system-audio.ts',
            import.meta.url,
        ),
        'utf8',
    );
    const module = { exports: {} };
    vm.runInNewContext(
        ts.transpileModule(source, {
            compilerOptions: {
                esModuleInterop: true,
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
            },
        }).outputText,
        {
            AudioContext,
            exports: module.exports,
            module,
            navigator: {
                mediaDevices: Object.assign(new EventTarget(), {
                    getDisplayMedia: () => {
                        captures++;
                        return new Promise((resolve, reject) => {
                            resolveCapture = resolve;
                            rejectCapture = reject;
                        });
                    },
                }),
            },
            require: (id) => {
                assert.ok(id in mocks, id);
                return mocks[id];
            },
            window: {
                api: {
                    utils: { isMacOS: () => false },
                    visualizer: {
                        onAudioReconfigured: (callback) => {
                            audioEvents.addEventListener('reconfigured', callback);
                            return () => audioEvents.removeEventListener('reconfigured', callback);
                        },
                    },
                },
                AudioContext,
            },
        },
    );
    return {
        capture: () => resolveCapture(stream),
        captures: () => captures,
        counts: () => ({ closed, inputs, stopped }),
        reconfigure: () => audioEvents.dispatchEvent(new Event('reconfigured')),
        rejectCapture: () =>
            rejectCapture(Object.assign(new Error('Capture aborted'), { name: 'AbortError' })),
        render(visible = true) {
            cursor = 0;
            const result = module.exports.useVisualizerSystemAudio({
                shouldAttemptConnection: visible,
            });
            pending.splice(0).forEach((effect) => effect());
            return result;
        },
        resume: () => resolveResume?.(),
        sourceDisconnections: () => sourceDisconnections,
        unmount: () => slots.forEach((slot) => slot.cleanup?.()),
        webAudio: () => webAudio,
    };
}

test('MPV output reconfiguration replaces a live capture without browser devicechange', async () => {
    const h = harness();
    const first = h.render().connect();
    h.capture();
    await new Promise(setImmediate);
    h.resume();
    await first;
    h.render();
    h.reconfigure();
    assert.equal(h.captures(), 2);
    assert.deepEqual(h.counts(), { closed: 1, inputs: 1, stopped: 1 });
    assert.equal(
        h.sourceDisconnections(),
        0,
        'consumer-owned input edges must survive until renderer cleanup',
    );
    h.capture();
    await new Promise(setImmediate);
    h.resume();
    await new Promise(setImmediate);
    assert.equal(h.counts().inputs, 2);
    h.unmount();
    h.reconfigure();
    assert.equal(h.captures(), 2);
});

test('a stale acquisition failure still releases its queued output recovery', async () => {
    const h = harness();
    const first = h.render().connect();
    h.reconfigure();
    h.rejectCapture();
    await first;
    assert.equal(h.captures(), 2);
    h.unmount();
    h.capture();
    await new Promise(setImmediate);
    assert.equal(h.counts().inputs, 0);
});

test('native output events cannot initiate or retry a denied activation', async () => {
    const h = harness();
    h.render();
    h.reconfigure();
    assert.equal(h.captures(), 0);
    const first = h.render().connect();
    h.rejectCapture();
    await first;
    h.reconfigure();
    assert.equal(h.captures(), 1);
    h.unmount();
});

test('output changes during acquisition coalesce into one replacement after acquisition settles', async () => {
    const h = harness();
    const first = h.render().connect();
    h.reconfigure();
    h.reconfigure();
    assert.equal(h.captures(), 1);
    h.capture();
    await new Promise(setImmediate);
    h.resume();
    await first;
    assert.equal(h.captures(), 2);
    assert.equal(h.counts().inputs, 0);
    h.capture();
    await new Promise(setImmediate);
    h.resume();
    await new Promise(setImmediate);
    assert.equal(h.counts().inputs, 1);
    h.unmount();
});

test('closing the surface cancels recovery queued behind a pending capture', async () => {
    const h = harness();
    const first = h.render().connect();
    h.reconfigure();
    h.render(false);
    h.capture();
    await first;
    assert.equal(h.captures(), 1);
    assert.equal(h.counts().inputs, 0);
    h.reconfigure();
    assert.equal(h.captures(), 1);
    h.unmount();
});

test('capture resolving after unmount stops its tracks without creating an input', async () => {
    const h = harness();
    const connecting = h.render().connect();
    h.unmount();
    h.capture();
    await new Promise(setImmediate);
    h.resume();
    await connecting;
    assert.deepEqual(h.counts(), { closed: 0, inputs: 0, stopped: 1 });
});

test('closing during AudioContext resume cannot restore a stale visualizer input', async () => {
    const h = harness();
    const connecting = h.render().connect();
    h.capture();
    await new Promise(setImmediate);
    h.render(false);
    h.resume();
    await connecting;
    assert.deepEqual(h.counts(), { closed: 1, inputs: 0, stopped: 1 });
    assert.equal(h.webAudio(), undefined);
});

test('visualizer cleanup preserves the web-player context and gain chain', () => {
    let closed = false;
    const original = {
        context: {
            close: () => {
                closed = true;
            },
        },
        dsp: {},
        gains: [{}],
    };
    const h = harness(original);
    h.render();
    h.unmount();
    assert.equal(h.webAudio(), original);
    assert.equal(closed, false);
});

test('bridge waits for the current activation acknowledgement and ignores a stale acknowledgement', async () => {
    let visible = true;
    let ready = null;
    let memo;
    let effectSurface;
    let cleanup;
    const acknowledgements = [];
    const requests = [];
    const mocks = {
        '/@/renderer/features/player/hooks/use-is-local-visualizer-surface-visible': {
            useIsLocalVisualizerSurfaceVisible: () => visible,
        },
        '/@/renderer/features/player/hooks/use-visualizer-system-audio': {},
        '/@/renderer/features/player/hooks/use-webaudio': {},
        '/@/renderer/store': { usePlaybackType: () => 'local' },
        '/@/renderer/utils/logger': { logger: { warn() {} } },
        '/@/shared/components/toast/toast': {},
        '/@/shared/types/types': { PlayerType: { LOCAL: 'local' } },
        '/@/shared/utils/visualizer-system-audio': systemAudio,
        'is-electron': () => true,
        react: {
            useEffect: (fn, [surface]) => {
                if (surface !== effectSurface) {
                    cleanup?.();
                    effectSurface = surface;
                    cleanup = fn();
                }
            },
            useMemo: (fn) => {
                if (!memo || memo.visible !== visible) memo = fn();
                return memo;
            },
            useState: () => [
                ready,
                (value) => {
                    ready = value;
                },
            ],
        },
        'react-i18next': {},
        'react/jsx-runtime': { jsx: (_component, props) => props },
    };
    const source = readFileSync(
        new URL(
            '../../src/renderer/features/visualizer/components/visualizer-system-audio-bridge.tsx',
            import.meta.url,
        ),
        'utf8',
    );
    const module = { exports: {} };
    vm.runInNewContext(
        ts.transpileModule(source, {
            compilerOptions: {
                esModuleInterop: true,
                jsx: ts.JsxEmit.ReactJSX,
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
            },
            fileName: 'bridge.tsx',
        }).outputText,
        {
            exports: module.exports,
            module,
            require: (id) => {
                assert.ok(id in mocks, id);
                return mocks[id];
            },
            window: {
                api: {
                    visualizer: {
                        setLocalSurfaceVisible: (value) => {
                            requests.push(value);
                            return new Promise((resolve) => acknowledgements.push(resolve));
                        },
                    },
                },
            },
        },
    );
    const render = module.exports.VisualizerSystemAudioBridgeHook;
    assert.equal(render().surfaceReady, false);
    visible = false;
    assert.equal(render().surfaceReady, false);
    acknowledgements[0](true);
    await new Promise(setImmediate);
    visible = true;
    assert.equal(render().surfaceReady, false);
    acknowledgements.at(-1)(true);
    await new Promise(setImmediate);
    assert.equal(render().surfaceReady, true);
    cleanup();
    assert.deepEqual(requests, [true, false, false, false, true, false]);
});
