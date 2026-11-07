/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-require-imports -- Electron native regression fixture. */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const scratch = path.join(process.env.TEMP, 'mini-player-native');
if (!process.versions.electron) {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const result = spawnSync(
        process.env.FEISHIN_FULLSCREEN_ELECTRON || require('electron'),
        [__filename],
        { env, stdio: 'inherit' },
    );
    if (result.error) throw result.error;
    const report = JSON.parse(fs.readFileSync(path.join(scratch, 'result.json'), 'utf8'));
    assert.equal(result.status, 0, JSON.stringify(report));
    assert.equal(report.passed, true, JSON.stringify(report));
    console.log(JSON.stringify(report));
} else {
    const { app, BrowserWindow, screen } = require('electron');
    fs.mkdirSync(scratch, { recursive: true });
    app.setPath('userData', path.join(scratch, 'profile'));
    const load = (file, imports = {}) => {
        const exports = {};
        const source = fs.readFileSync(path.resolve(__dirname, '../../src/main', file), 'utf8');
        vm.runInNewContext(
            ts.transpileModule(source, {
                compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
            }).outputText,
            {
                exports,
                require: (id) => {
                    assert.ok(imports[id], id);
                    return imports[id];
                },
            },
        );
        return exports;
    };
    app.whenReady()
        .then(async () => {
            const bounds = load('utils/mini-player-bounds.ts');
            const { createMiniPlayer } = load('features/core/mini-player.ts', {
                '../../utils/mini-player-bounds': bounds,
            });
            const window = new BrowserWindow({
                focusable: false,
                frame: false,
                height: 700,
                minHeight: 120,
                minWidth: 480,
                opacity: 0,
                show: false,
                skipTaskbar: true,
                width: 900,
            });
            await window.loadURL(
                'data:text/html,<html><body>Native mini-player lifecycle</body></html>',
            );
            let saved;
            const areaQueries = [];
            let pinned = true;
            const mini = createMiniPlayer(window, {
                alwaysOnTop: () => pinned,
                area: (rect) => {
                    areaQueries.push(rect);
                    return screen.getDisplayMatching(rect).workArea;
                },
                readBounds: () => saved,
                saveBounds: (rect) => {
                    saved = rect;
                },
            });
            const normal = window.getContentBounds();
            await mini.command({ action: 'enter' });
            assert.equal(mini.getState().active, false, 'No track must not shrink login');
            mini.setTrackAvailable(true);
            const renderer = window.webContents.id;
            await mini.command({ action: 'enter' });
            const near = (actual, expected) =>
                assert.ok(
                    Math.abs(actual - expected) <= 1,
                    `${actual} vs ${expected} (DIP rounding)`,
                );
            near(window.getContentBounds().width, 320);
            near(window.getContentBounds().height, 320);
            assert.equal(window.isAlwaysOnTop(), true);
            const square = window.getContentBounds();
            await mini.command({ action: 'queue', queueOpen: true });
            const expanded = window.getContentBounds();
            near(expanded.height, 560);
            near(expanded.y + expanded.height, square.y + square.height);
            await mini.command({ action: 'queue', queueOpen: false });
            for (const key of ['x', 'y', 'width', 'height'])
                near(window.getContentBounds()[key], square[key]);
            for (let cycle = 0; cycle < 10; cycle++) {
                await mini.command({ action: 'queue', queueOpen: true });
                await mini.command({ action: 'queue', queueOpen: false });
            }
            for (const key of ['x', 'y', 'width', 'height'])
                near(window.getContentBounds()[key], square[key]);
            const beforeResize = window.getBounds();
            let resizePrevented = false;
            window.emit(
                'will-resize',
                {
                    preventDefault: () => {
                        resizePrevented = true;
                    },
                },
                { ...beforeResize, width: beforeResize.width + 100 },
                { edge: 'right' },
            );
            assert.equal(resizePrevented, true);
            near(window.getContentBounds().width, square.width + 100);
            near(window.getContentBounds().height, window.getContentBounds().width);
            pinned = false;
            mini.refreshPin();
            assert.equal(window.isAlwaysOnTop(), false);
            await mini.command({ action: 'restore' });
            assert.deepEqual(window.getContentBounds(), normal);
            assert.equal(window.webContents.id, renderer);
            assert.deepEqual(window.getMinimumSize(), [480, 120]);
            const maximized = new Promise((resolve) => window.once('maximize', resolve));
            window.maximize();
            await maximized;
            const remembered = { ...saved };
            areaQueries.length = 0;
            await mini.command({ action: 'enter' });
            assert.deepEqual(
                { ...areaQueries[0] },
                remembered,
                'Re-entry chooses the remembered mini display',
            );
            assert.equal(window.isMaximized(), false);
            await mini.command({ action: 'restore' });
            assert.equal(window.isMaximized(), true);
            window.unmaximize();
            const fullscreen = new Promise((resolve) => window.once('enter-full-screen', resolve));
            window.setFullScreen(true);
            await fullscreen;
            await mini.command({ action: 'enter' });
            assert.equal(window.isFullScreen(), false);
            assert.equal(mini.getDesktop().fullscreen, true);
            await mini.command({ action: 'restore' });
            assert.equal(window.isFullScreen(), true);
            const left = new Promise((resolve) => window.once('leave-full-screen', resolve));
            window.setFullScreen(false);
            await left;
            await mini.command({ action: 'enter' });
            const minimized = new Promise((resolve) => window.once('minimize', resolve));
            await mini.command({ action: 'dismiss' });
            await minimized;
            assert.equal(mini.consumeDismissMinimize(), true);
            assert.equal(mini.consumeDismissMinimize(), false);
            assert.equal(mini.getState().active, false);
            window.hide();
            assert.equal(window.isVisible(), false);
            assert.equal(window.getOpacity(), 0);
            assert.equal(window.isFocusable(), false);
            const report = {
                dismissDoesNotReenter: true,
                electron: process.versions.electron,
                fullscreenRestored: true,
                hidden: true,
                maximizedRestored: true,
                normalRestored: true,
                passed: true,
                queueBottomAnchored: true,
                sameRenderer: true,
            };
            fs.writeFileSync(path.join(scratch, 'result.json'), JSON.stringify(report));
            window.destroy();
            app.quit();
        })
        .catch((error) => {
            fs.writeFileSync(
                path.join(scratch, 'result.json'),
                JSON.stringify({ error: error.stack, passed: false }),
            );
            app.exit(1);
        });
}
