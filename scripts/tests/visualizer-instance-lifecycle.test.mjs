/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-empty-function -- React/native lifecycle fixture. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

test('AudioMotion owns exactly one canvas after input replacement and releases it on unmount', async () => {
    const slots = [];
    const effects = [];
    const canvases = new Set();
    const container = {};
    let cursor = 0;
    let dirty = false;
    let webAudio = { context: {}, visualizerInputs: [{}] };
    const settings = {
        audiomotionanalyzer: { channelLayout: 'single', customGradients: [], gradient: 'classic' },
        type: 'audiomotionanalyzer',
    };
    const memo = (fn, deps) => {
        const index = cursor++;
        if (!slots[index] || deps.some((value, i) => value !== slots[index].deps[i])) {
            slots[index] = { deps, value: fn() };
        }
        return slots[index].value;
    };
    const react = {
        createRef: () => ({ current: container }),
        useCallback: (fn, deps) => memo(() => fn, deps),
        useEffect: (fn, deps) => {
            const index = cursor++;
            const old = slots[index];
            if (!old || deps.some((value, i) => value !== old.deps[i])) {
                effects.push(() => {
                    old?.cleanup?.();
                    slots[index] = { cleanup: fn(), deps };
                });
            }
        },
        useMemo: memo,
        useRef: (value) => (slots[cursor++] ??= { current: value }),
        useState: (value) => {
            const index = cursor++;
            slots[index] ??= { value };
            slots[index].set ??= (next) => {
                const result = typeof next === 'function' ? next(slots[index].value) : next;
                if (result !== slots[index].value) {
                    slots[index].value = result;
                    dirty = true;
                }
            };
            return [slots[index].value, slots[index].set];
        },
    };
    class AudioMotion {
        constructor() {
            canvases.add(this);
        }
        connectInput() {}
        destroy() {
            canvases.delete(this);
        }
        registerGradient() {}
        setOptions() {}
    }
    const bindings = {
        getVisualizerAudioNodes: (audio) => audio.visualizerInputs,
        PlayerStatus: { PLAYING: 'playing' },
        PlayerType: { LOCAL: 'local', WEB: 'web' },
        useAccent: () => 'blue',
        usePlaybackType: () => 'local',
        usePlayerStatus: () => 'playing',
        useSettingsStore: (select) => select({ visualizer: settings }),
        useWebAudio: () => ({ webAudio }),
    };
    const source = readFileSync(
        new URL(
            '../../src/renderer/features/visualizer/components/audiomotionanalyzer/visualizer.tsx',
            import.meta.url,
        ),
        'utf8',
    ).replace('const VisualizerInner =', 'export const VisualizerInner =');
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(source, {
            compilerOptions: {
                esModuleInterop: true,
                jsx: ts.JsxEmit.ReactJSX,
                module: ts.ModuleKind.CommonJS,
            },
            fileName: 'visualizer.tsx',
        }).outputText,
        {
            clearTimeout,
            console,
            exports,
            require: (id) => {
                if (id === 'react') return react;
                if (id === 'audiomotion-analyzer')
                    return { __esModule: true, default: AudioMotion };
                if (id === 'react/jsx-runtime')
                    return {
                        jsx: (_type, props) => {
                            if (props.ref) props.ref.current = container;
                            return null;
                        },
                    };
                return bindings;
            },
            setTimeout,
        },
    );
    const render = () => {
        for (let pass = 0; pass < 30; pass++) {
            dirty = false;
            cursor = 0;
            exports.VisualizerInner();
            effects.splice(0).forEach((effect) => effect());
            if (!dirty) return;
        }
        assert.fail('Visualizer does not settle after its own state updates');
    };
    render();
    await new Promise(setImmediate);
    render();
    assert.equal(canvases.size, 1);
    webAudio = { context: {}, visualizerInputs: [{}] };
    render();
    assert.equal(
        canvases.size,
        1,
        'old canvas must be removed before the replacement is displayed',
    );
    slots.forEach((slot) => slot.cleanup?.());
    assert.equal(canvases.size, 0);
});
