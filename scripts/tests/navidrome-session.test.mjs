/* eslint-disable @typescript-eslint/explicit-function-return-type -- Transport regression runs directly in Node. */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

const require = createRequire(import.meta.url);
const ignore = () => undefined;
function load(path, mocks = {}) {
    const exports = {};
    const code = ts.transpileModule(
        readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'),
        {
            compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS },
        },
    ).outputText;
    vm.runInNewContext(code, {
        clearTimeout,
        console: { error: ignore },
        exports,
        require: (name) => (name in mocks ? mocks[name] : require(name)),
        setTimeout,
        URL,
        URLSearchParams,
        window: { api: { localSettings: mocks.localSettings } },
    });
    return exports;
}

test('native session renewal isolates resource failures, coalesces requests and preserves saved credentials', async (t) => {
    let logins = 0;
    let resourceStatus = 404;
    let loginStatus = 200;
    let releaseLogin;
    const loginStarted = [];
    const http = createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.url === '/auth/login') {
            logins++;
            loginStarted.shift()?.();
            if (releaseLogin) await releaseLogin;
            res.statusCode = loginStatus;
            res.end(
                JSON.stringify({ subsonicSalt: 'salt', subsonicToken: 'hash', token: 'fresh' }),
            );
        } else if (req.headers['x-nd-authorization'] !== 'Bearer fresh') {
            res.statusCode = 401;
            res.end('{}');
        } else {
            res.statusCode = resourceStatus;
            res.end(resourceStatus === 200 ? '[]' : '{"error":"song not found"}');
        }
    });
    http.listen(0, '127.0.0.1');
    await once(http, 'listening');
    t.after(() => new Promise((resolve) => http.close(resolve)));
    let server = {
        credential: 'u=test&s=old&t=old',
        id: 'one',
        ndCredential: 'expired',
        savePassword: true,
        url: `http://127.0.0.1:${http.address().port}`,
        username: 'test',
    };
    const failures = [];
    const removed = [];
    const store = {
        actions: {
            getServer: () => server,
            updateServer: (_id, values) => {
                server = { ...server, ...values };
            },
        },
        get currentServer() {
            return server;
        },
        get serverList() {
            return { one: server };
        },
    };
    const localSettings = {
        passwordGet: async () => 'saved-password',
        passwordRemove: (id) => removed.push(id),
    };
    const api = load('src/renderer/api/navidrome/navidrome-api.ts', {
        '/@/i18n/i18n': { t: (key) => key },
        '/@/renderer/api/response-validation': { validateResponse: ignore },
        '/@/renderer/api/utils': { authenticationFailure: (...args) => failures.push(args) },
        '/@/renderer/store': { useAuthStore: { getState: () => store } },
        '/@/renderer/utils/logger': { logger: { error: ignore, warn: ignore } },
        '/@/renderer/utils/normalize-server-url': { getServerUrl: (s) => s.url },
        '/@/shared/api/navidrome/navidrome-types': load(
            'src/shared/api/navidrome/navidrome-types.ts',
        ),
        '/@/shared/api/utils': {
            resultWithHeaders: (data) => z.object({ data, headers: z.any() }),
        },
        '/@/shared/components/toast/toast': { toast: { error: ignore } },
        'is-electron': () => true,
        localSettings,
    });
    const get = () => api.ndApiClient({ server }).getSongDetail({ params: { id: 'old-song' } });
    await get().catch(() => {});
    assert.equal(logins, 1);
    assert.equal(
        failures.length,
        0,
        'a resource 404 after successful renewal must not invalidate authentication',
    );
    assert.equal(server.ndCredential, 'fresh');
    assert.equal(server.savePassword, true);
    assert.equal(removed.length, 0);

    server = { ...server, ndCredential: 'expired-again' };
    resourceStatus = 200;
    let release;
    releaseLogin = new Promise((resolve) => {
        release = resolve;
    });
    const started = new Promise((resolve) => loginStarted.push(resolve));
    const a = get();
    await started;
    const b = get();
    release();
    await Promise.all([a, b]);
    assert.equal(logins, 2, 'concurrent requests share one native login');
    assert.equal(failures.length, 0);

    server = { ...server, ndCredential: 'expired-on-rate-limit' };
    releaseLogin = null;
    loginStatus = 429;
    await get().catch(() => {});
    assert.equal(
        failures.length,
        0,
        'rate limiting must preserve the selected session and saved password',
    );
    assert.equal(server.savePassword, true);
});

test('automatic session expiry retains saved password and preference and ignores stale sessions', () => {
    const removed = [];
    const server = { credential: 'u=test', id: 'one', ndCredential: 'expired', savePassword: true };
    const state = {
        actions: {
            logout() {
                server.credential = '';
                server.ndCredential = undefined;
                server.savePassword = false;
                state.currentServer = null;
            },
            setCurrentServer(value) {
                state.currentServer = value;
            },
            updateServer(_id, values) {
                Object.assign(server, values);
            },
        },
        currentServer: server,
        serverList: { one: server },
    };
    const utils = load('src/renderer/api/utils.ts', {
        '/@/i18n/i18n': { t: (key) => key },
        '/@/renderer/store': { useAuthStore: { getState: () => state } },
        '/@/shared/components/toast/toast': { toast: { error: ignore } },
        'is-electron': () => true,
        localSettings: { passwordRemove: (id) => removed.push(id) },
    });
    utils.authenticationFailure({ ...server });
    assert.equal(server.savePassword, true);
    assert.equal(removed.length, 0);
    assert.equal(state.currentServer, null);
    server.ndCredential = 'new-session';
    state.currentServer = server;
    utils.authenticationFailure({ ...server, ndCredential: 'old-session' });
    assert.equal(state.currentServer, server, 'an old response cannot expire a newer token');
    utils.authenticationFailure({ ...server, id: 'another-server' });
    assert.equal(state.currentServer, server, 'another server cannot sign out the current account');
});
