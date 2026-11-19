/* eslint-disable @typescript-eslint/explicit-function-return-type -- Execute the production layout hooks in an isolated Node fixture. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// The desktop layout stays mounted under the mini-player. Squeezing it into the mini window made
// virtualized grids crash React ("removeChild ... not a child of this node"), so the hidden layout
// must keep its last desktop width and release it on restore.
const fixture = (initialWidth) => {
    const window = new EventTarget();
    window.innerWidth = initialWidth;
    let mini = false;
    // React keeps refs across renders; mirror that by call order.
    const refs = [];
    let refIndex = 0;
    const effects = [];
    const layoutEffects = [];
    const layout = { style: { width: '' } };
    const hooks = {
        useEffect: (effect) => effects.push(effect),
        useLayoutEffect: (effect) => layoutEffects.push(effect),
        useRef: (value) => {
            if (refs.length <= refIndex) refs.push({ current: value });
            return refs[refIndex++];
        },
    };
    const store = Object.assign((select) => select({ active: mini }), {
        getState: () => ({ active: mini }),
    });
    const modules = {
        './default-layout.module.css': { default: {} },
        '/@/renderer/features/context-menu/context-menu-controller': {
            ContextMenuController: { Root: 'ContextMenu' },
        },
        '/@/renderer/hooks/use-fullscreen-controls-auto-hide': {
            useFullscreenControlsAutoHide: () => false,
        },
        '/@/renderer/store/mini-player.store': { useMiniPlayerStore: store },
        '/@/renderer/store/settings.store': {
            useSettingsStore: { getState: () => ({ playback: { type: 'web' } }) },
            useWindowBarStyle: () => 'windows',
        },
        '/@/shared/types/types': {
            Platform: { MACOS: 'macos', WINDOWS: 'windows' },
            PlayerType: { JUKEBOX: 'jukebox', WEB: 'web' },
        },
        clsx: { default: () => '' },
        'is-electron': { default: () => true },
        react: hooks,
        'react/jsx-runtime': { Fragment: 'Fragment', jsx: () => null, jsxs: () => null },
    };
    const exports = {};
    const source = readFileSync(
        new URL('../../src/renderer/layouts/default-layout.tsx', import.meta.url),
        'utf8',
    );
    vm.runInNewContext(
        ts.transpileModule(source, {
            compilerOptions: {
                jsx: ts.JsxEmit.ReactJSX,
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
            },
        }).outputText,
        {
            exports,
            require: (id) => modules[id] ?? {},
            window,
        },
    );
    const render = (active) => {
        mini = active;
        refIndex = 0;
        effects.length = 0;
        layoutEffects.length = 0;
        exports.DefaultLayout({});
        refs[0].current = layout;
        return refs[1];
    };
    return {
        layout,
        render,
        resize: (width) => {
            window.innerWidth = width;
            window.dispatchEvent(new Event('resize'));
        },
        runEffects: () => effects.map((effect) => effect()),
        runLayoutEffects: () => layoutEffects.forEach((effect) => effect()),
    };
};

test('the hidden desktop layout keeps its last desktop width while the mini-player is open', () => {
    const app = fixture(1440);
    const desktopWidth = app.render(false);
    const [dispose] = app.runEffects();
    app.runLayoutEffects();
    assert.equal(app.layout.style.width, '');

    app.resize(1600);
    assert.equal(desktopWidth.current, 1600);

    app.render(true);
    // The mini window's own size is never recorded as the desktop width.
    app.resize(320);
    app.runLayoutEffects();
    assert.equal(app.layout.style.width, '1600px');

    app.render(false);
    app.runLayoutEffects();
    assert.equal(app.layout.style.width, '');
    dispose();
});

test('a layout first mounted at a mobile width falls back to a desktop width', () => {
    const app = fixture(320);
    app.render(true);
    app.runLayoutEffects();
    assert.equal(app.layout.style.width, '1280px');
});
