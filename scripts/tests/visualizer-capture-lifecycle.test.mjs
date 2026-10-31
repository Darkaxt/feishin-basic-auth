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
    let resolveResume;
    let stopped = 0;
    let closed = 0;
    let inputs = 0;
    const track = new EventTarget();
    track.stop = () => stopped++;
    const stream = {
        getAudioTracks: () => [track],
        getTracks: () => [track],
        getVideoTracks: () => [],
    };
    const pending = [];
    const react = {
        useCallback: (fn) => fn,
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
            return { disconnect() {} };
        }
        resume() {
            return new Promise((resolve) => {
                resolveResume = resolve;
            });
        }
    }
    const mocks = {
        '/@/i18n/i18n': { default: { t: (key) => key } },
        '/@/renderer/features/player/hooks/use-webaudio': {
            useWebAudio: () => ({
                setWebAudio: (next) => {
                    webAudio = next;
                    if (next?.visualizerInputs?.length) inputs++;
                },
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
                    getDisplayMedia: () =>
                        new Promise((resolve) => {
                            resolveCapture = resolve;
                        }),
                }),
            },
            require: (id) => {
                assert.ok(id in mocks, id);
                return mocks[id];
            },
            window: { api: { utils: { isMacOS: () => false } }, AudioContext },
        },
    );
    return {
        capture: () => resolveCapture(stream),
        counts: () => ({ closed, inputs, stopped }),
        render(visible = true) {
            cursor = 0;
            const result = module.exports.useVisualizerSystemAudio({
                shouldAttemptConnection: visible,
            });
            pending.splice(0).forEach((effect) => effect());
            return result;
        },
        resume: () => resolveResume?.(),
        unmount: () => slots.forEach((slot) => slot.cleanup?.()),
        webAudio: () => webAudio,
    };
}

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
