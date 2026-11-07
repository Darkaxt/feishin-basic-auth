/* eslint-disable @typescript-eslint/explicit-function-return-type -- Native IPC hook regression fixture. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const harness = () => {
    const effects = [];
    const disposers = [];
    const window = new EventTarget();
    window.innerWidth = 320;
    let state = { active: true, queueOpen: false };
    let listener;
    let resolveSnapshot;
    let subscriptions = 0;
    const snapshot = new Promise((resolve) => {
        resolveSnapshot = resolve;
    });
    window.api = {
        browser: {
            miniPlayerState: () => snapshot,
            miniPlayerTrack: () => {},
            onMiniPlayerState: (callback) => {
                listener = callback;
                subscriptions++;
                return () => {
                    subscriptions--;
                };
            },
        },
        localSettings: { set: () => {} },
    };
    const store = {
        getState: () => state,
        setState: (value) => {
            state = { ...value };
        },
    };
    const imports = {
        '/@/renderer/store/mini-player.store': { useMiniPlayerStore: store },
        '/@/renderer/store/player.store': { usePlayerSong: () => ({ id: 'loaded-track' }) },
        '/@/renderer/store/settings.store': {
            useWindowSettings: () => ({ miniPlayerAlwaysOnTop: true, miniPlayerOnMinimize: true }),
        },
        'is-electron': { default: () => true },
        react: { useEffect: (effect) => effects.push(effect) },
        'react-dom': { flushSync: (callback) => callback() },
    };
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(
            readFileSync(
                new URL('../../src/renderer/hooks/use-mini-player.ts', import.meta.url),
                'utf8',
            ),
            {
                compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
            },
        ).outputText,
        {
            exports,
            require: (id) => {
                assert.ok(imports[id], id);
                return imports[id];
            },
            window,
        },
    );
    exports.useMiniPlayer();
    for (const effect of effects) disposers.push(effect());
    return {
        close: () => {
            for (const dispose of disposers) dispose?.();
        },
        publish: (value) => listener(value),
        resize: (width) => {
            window.innerWidth = width;
            window.dispatchEvent(new Event('resize'));
        },
        resolveSnapshot,
        state: () => state,
        subscriptions: () => subscriptions,
    };
};

test('restore keeps the desktop mounted until Chromium receives the desktop viewport', async () => {
    const fixture = harness();
    fixture.publish({ active: false, queueOpen: false, viewportWidth: 1100 });
    assert.equal(fixture.state().active, true);
    fixture.resize(640);
    assert.equal(fixture.state().active, true);
    fixture.resize(1100);
    assert.equal(fixture.state().active, false);
    fixture.resolveSnapshot({ active: true, queueOpen: false });
    await Promise.resolve();
    assert.equal(
        fixture.state().active,
        false,
        'A late startup snapshot cannot overwrite a newer event',
    );
    fixture.close();
    assert.equal(fixture.subscriptions(), 0);
});

test('a newer mini request cancels the old viewport wait and unmount removes listeners', () => {
    const fixture = harness();
    fixture.publish({ active: false, queueOpen: false, viewportWidth: 1100 });
    fixture.publish({ active: true, queueOpen: true });
    fixture.resize(1100);
    assert.equal(fixture.state().active, true);
    assert.equal(fixture.state().queueOpen, true);
    fixture.publish({ active: false, queueOpen: false, viewportWidth: 900 });
    fixture.close();
    fixture.resize(900);
    assert.equal(fixture.state().active, true);
    assert.equal(fixture.subscriptions(), 0);
});
