/* eslint-disable @typescript-eslint/explicit-function-return-type -- Execute the production accent module in an isolated Node fixture. */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const loadReadableForeground = () => {
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(read('src/shared/utils/readable-foreground.ts'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
        { exports },
    );
    return exports.readableForeground;
};

// Loads src/main/features/core/system-accent.ts against a fake Electron on the given platform.
const loadAccentModule = (platform, accent) => {
    const systemPreferences = Object.assign(new EventEmitter(), {
        getAccentColor: () => accent.value,
    });
    const handlers = {};
    const sent = [];
    const electron = {
        BrowserWindow: {
            getAllWindows: () => [
                { webContents: { send: (channel, value) => sent.push([channel, value]) } },
            ],
        },
        ipcMain: { handle: (channel, handler) => (handlers[channel] = handler) },
        systemPreferences,
    };
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(read('src/main/features/core/system-accent.ts'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
        { exports, process: { platform }, require: (id) => (id === 'electron' ? electron : {}) },
    );
    return { exports, handlers, sent, systemPreferences };
};

test('the Windows accent reaches the renderer and follows live changes', () => {
    const accent = { value: 'AD5D54FF' };
    const { handlers, sent, systemPreferences } = loadAccentModule('win32', accent);

    assert.equal(handlers['system-accent-color'](), '#ad5d54');

    accent.value = '33AA55FF';
    systemPreferences.emit('accent-color-changed', {}, '33AA55FF');
    assert.deepEqual(sent, [['system-accent-color', '#33aa55']]);

    // Wallpaper-driven accent changes arrive as color-changed; unchanged colours are not resent.
    systemPreferences.emit('color-changed', {});
    accent.value = 'F0E68CFF';
    systemPreferences.emit('color-changed', {});
    assert.deepEqual(sent.at(-1), ['system-accent-color', '#f0e68c']);
    assert.equal(sent.length, 2);
    assert.equal(handlers['system-accent-color'](), '#f0e68c');
});

test('platforms without a system accent fall back to the theme accent', () => {
    const { exports, handlers } = loadAccentModule('linux', {
        get value() {
            throw new Error('not available');
        },
    });

    assert.equal(handlers['system-accent-color'](), null);
    assert.equal(exports.normalizeSystemAccent('nope'), null);
    assert.equal(exports.normalizeSystemAccent('0078D4'), '#0078d4');
});

test('mini-player controls pick a readable foreground for the accent', () => {
    const source = read('src/renderer/features/player/components/mini-player.tsx');
    const css = read('src/renderer/features/player/components/mini-player.module.css');

    assert.match(source, /useSystemAccentColor\(\)/u);
    assert.match(source, /'--mini-on-accent': readableForeground\(systemAccent\)/u);
    const readableForeground = loadReadableForeground();
    // Whichever of white or near-black has the higher WCAG contrast on the accent.
    for (const accent of ['#ad5d54', '#0078d4', '#e81123', '#744da9', '#000000']) {
        assert.equal(readableForeground(accent), '#ffffff', accent);
    }
    for (const accent of ['#f0e68c', '#ffb900', '#33aa55', '#ffffff']) {
        assert.equal(readableForeground(accent), '#111111', accent);
    }

    assert.match(css, /--mini-accent: var\(--theme-colors-primary\)/u);
    assert.match(css, /\.turntable \{[^}]*background-color: var\(--mini-accent\)/u);
    assert.match(css, /\.overlay \{[^}]*color: var\(--mini-on-accent\)/u);
    // The shared ActionIcon variant rules must not win over the accent chips and icon colour.
    assert.match(
        css,
        /\.mini \.overlay button\[data-variant\] \{[^}]*color: var\(--mini-on-accent\)/u,
    );
    assert.match(
        css,
        /\.mini \.overlay \.transport button\[data-variant\] \{[^}]*background: var\(--mini-chip\)/u,
    );
    assert.doesNotMatch(css, /color: white/u);
    assert.equal(css.match(/--theme-colors-primary/gu).length, 1);
});
