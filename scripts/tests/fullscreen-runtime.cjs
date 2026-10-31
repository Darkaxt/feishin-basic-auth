/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-require-imports -- Electron loads this native fixture as CommonJS. */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// The invoking workflow owns TEMP and its cleanup. Keep the isolated native profile
// under that same registered scratch root, never the installed Feishin profile.
const scratch = path.join(
    process.env.TEMP || require('node:os').tmpdir(),
    'feishin-fullscreen-check',
);

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
    const packagedVersion = fs
        .readFileSync(path.resolve(__dirname, '../../electron-builder.yml'), 'utf8')
        .match(/^electronVersion:\s*(\S+)/m)?.[1];
    assert.equal(
        report.electron,
        packagedVersion,
        `Fullscreen gate must use the packaged Electron version. Set FEISHIN_FULLSCREEN_ELECTRON to Electron ${packagedVersion}; the dependency runtime is ${report.electron}.`,
    );
    console.log(JSON.stringify(report));
} else {
    const { app, BrowserWindow, Menu, screen, session } = require('electron');
    fs.mkdirSync(scratch, { recursive: true });
    app.setPath('userData', path.join(scratch, 'profile'));
    app.disableHardwareAcceleration();
    app.whenReady()
        .then(async () => {
            const root = path.resolve(__dirname, '../..');
            const source = fs.readFileSync(path.join(root, 'src/main/index.ts'), 'utf8');
            const start = source.indexOf('const ALLOWED_PERMISSIONS =');
            const end = source.indexOf(
                'session.defaultSession.webRequest.onHeadersReceived',
                start,
            );
            assert.ok(start >= 0 && end > start);
            const ses = session.fromPartition('fullscreen-contract');
            // Electron can restore a hidden HWND on fullscreen exit. Keep this fixture
            // transparent and nonactivating for its complete native lifecycle.
            const window = new BrowserWindow({
                focusable: false,
                height: 600,
                opacity: 0,
                show: false,
                skipTaskbar: true,
                webPreferences: { backgroundThrottling: false, session: ses },
                width: 800,
            });
            Menu.setApplicationMenu(null);
            const capture = { exports: {} };
            vm.runInNewContext(
                ts.transpileModule(
                    fs.readFileSync(
                        path.join(root, 'src/main/features/core/visualizer/capture-permissions.ts'),
                        'utf8',
                    ),
                    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
                ).outputText,
                { exports: capture.exports, URL },
            );
            const permissions = [];
            vm.runInNewContext(
                ts.transpileModule(source.slice(start, end), {
                    compilerOptions: { target: ts.ScriptTarget.ES2022 },
                }).outputText,
                {
                    ...capture.exports,
                    canHandleVisualizerDisplayMedia: () => false,
                    mainWindow: window,
                    session: {
                        defaultSession: {
                            setPermissionCheckHandler: (handler) =>
                                ses.setPermissionCheckHandler((...args) => handler(...args)),
                            setPermissionRequestHandler: (handler) =>
                                ses.setPermissionRequestHandler(
                                    (wc, permission, callback, details) =>
                                        handler(
                                            wc,
                                            permission,
                                            (allowed) => {
                                                permissions.push({ allowed, permission });
                                                callback(allowed);
                                                if (permission === 'fullscreen' && !allowed) {
                                                    fs.writeFileSync(
                                                        path.join(scratch, 'result.json'),
                                                        JSON.stringify({
                                                            passed: false,
                                                            permissions,
                                                            reason: 'Production fullscreen permission denied',
                                                        }),
                                                    );
                                                    window.destroy();
                                                    app.exit(1);
                                                }
                                            },
                                            details,
                                        ),
                                ),
                        },
                    },
                },
            );
            const page = path.join(scratch, 'index.html');
            fs.writeFileSync(
                page,
                '<!doctype html><html><body><input id="input"><div id="visualizer-fullscreen-target">Visualizer</div></body></html>',
            );
            await window.loadFile(page);
            const hook = (file) =>
                ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
                    compilerOptions: {
                        module: ts.ModuleKind.CommonJS,
                        target: ts.ScriptTarget.ES2022,
                    },
                }).outputText;
            await window.webContents.executeJavaScript(`(() => {
            window.testExpanded = false;
            const load = code => {
                const exports = {};
                const require = id => {
                    if (id === 'react') return {
                        useEffect: fn => { fn(); }, useCallback: fn => fn,
                        useRef: value => ({ current: value }),
                        useState: () => [false, value => { window.controlsHidden = value; window.dispatchEvent(new Event('controls-state')); }],
                    };
                    return { useFullScreenPlayerStore: { getState: () => ({ visualizerExpanded: window.testExpanded }) } };
                };
                new Function('exports', 'require', code)(exports, require);
                return exports;
            };
            load(${JSON.stringify(hook('src/renderer/hooks/use-fullscreen-toggle.ts'))}).useFullscreenToggle();
            load(${JSON.stringify(hook('src/renderer/hooks/use-fullscreen-controls-auto-hide.ts'))}).useFullscreenControlsAutoHide();
        })()`);
            // Exercise the production key listener with user activation without
            // focusing a native window or dispatching keys to the user's desktop.
            const pressF11 = (expanded) =>
                window.webContents.executeJavaScript(
                    `(async () => {
                window.testExpanded = ${expanded};
                const changed = new Promise(resolve => document.addEventListener('fullscreenchange', resolve, { once: true }));
                document.querySelector('input').focus();
                document.querySelector('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'F11', bubbles: true, cancelable: true }));
                await changed;
                return document.fullscreenElement?.id || (document.fullscreenElement === document.documentElement ? 'document' : null);
            })()`,
                    true,
                );
            const normal = window.getBounds();
            const target = await pressF11(false);
            assert.equal(target, 'document');
            assert.equal(window.isFullScreen(), true);
            const fullscreenBounds = window.getBounds();
            assert.deepEqual(fullscreenBounds, screen.getDisplayMatching(fullscreenBounds).bounds);
            await window.webContents.executeJavaScript(`new Promise(resolve => {
            const changed = () => { if (window.controlsHidden) { window.removeEventListener('controls-state', changed); resolve(true); } };
            window.addEventListener('controls-state', changed); changed();
        })`);
            assert.equal(
                await window.webContents.executeJavaScript(
                    `window.dispatchEvent(new Event('pointermove')); window.controlsHidden`,
                ),
                false,
            );
            assert.equal(await pressF11(false), null);
            window.hide();
            assert.equal(window.isFullScreen(), false);
            assert.deepEqual(window.getBounds(), normal);
            assert.equal(
                await window.webContents.executeJavaScript('window.controlsHidden'),
                false,
            );
            assert.equal(await pressF11(true), 'visualizer-fullscreen-target');
            assert.equal(
                await window.webContents.executeJavaScript('window.controlsHidden'),
                false,
            );
            await window.webContents.executeJavaScript('document.exitFullscreen()', true);
            window.hide();
            assert.equal(window.isFullScreen(), false);
            assert.deepEqual(window.getBounds(), normal);
            const report = {
                autohideAndReveal: true,
                electron: process.versions.electron,
                finalVisible: window.isVisible(),
                focusable: window.isFocusable(),
                fullscreenBounds,
                nativeFullscreen: true,
                normalBoundsRestored: true,
                opacity: window.getOpacity(),
                passed: true,
                permissions,
                visualizerTargetPreserved: true,
            };
            assert.equal(report.opacity, 0);
            assert.equal(report.focusable, false);
            assert.equal(report.finalVisible, false);
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
