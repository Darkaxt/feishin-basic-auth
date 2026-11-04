/* eslint-disable @typescript-eslint/explicit-function-return-type -- Node executes the transport regression directly. */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const features = load('src/shared/types/features-types.ts');
const lyrics = await import('../../src/shared/utils/lyrics.ts');

function load(path, mocks = {}) {
    const exports = {};
    const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, {
        compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInNewContext(code, {
        AbortController,
        console: { error: () => {} },
        exports,
        require: (name) => {
            if (name in mocks) return mocks[name];
            if (name.startsWith('/@/')) throw new Error(`Missing test dependency: ${name}`);
            return require(name);
        },
        TextDecoder,
        TextEncoder,
        URL,
        URLSearchParams,
    });
    return exports;
}

test('startup lyrics probes recover from obsolete tracks without per-track errors and preserve auth errors', async (t) => {
    let errorCode = 70;
    let structuredLyrics = [];
    const requests = [];
    const server = createServer((request, response) => {
        requests.push(new URL(request.url, 'http://localhost').pathname);
        response.setHeader('Content-Type', 'application/json');
        response.end(
            JSON.stringify({
                'subsonic-response': errorCode
                    ? {
                          error: {
                              code: errorCode,
                              message:
                                  errorCode === 70
                                      ? 'Data not found'
                                      : 'Wrong username or password',
                          },
                          status: 'failed',
                          version: '1.16.1',
                      }
                    : { lyricsList: { structuredLyrics }, status: 'ok', version: '1.16.1' },
            }),
        );
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(
        () =>
            new Promise((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve())),
            ),
    );
    const currentServer = {
        credential: 'u=test&s=test&t=test',
        name: 'test server',
        url: `http://127.0.0.1:${server.address().port}`,
        username: 'test',
    };
    const notifications = [];
    const authFailures = [];
    const api = load('src/renderer/api/subsonic/subsonic-api.ts', {
        '/@/i18n/i18n': { t: (key) => key },
        '/@/renderer/api/response-validation': { validateResponse: () => {} },
        '/@/renderer/api/utils': { authenticationFailure: (...args) => authFailures.push(args) },
        '/@/renderer/store': { useAuthStore: { getState: () => ({ currentServer }) } },
        '/@/renderer/utils/normalize-server-url': { getServerUrl: (server) => server.url },
        '/@/shared/api/subsonic/subsonic-types': load('src/shared/api/subsonic/subsonic-types.ts'),
        '/@/shared/api/utils': { hasFeature: () => false },
        '/@/shared/components/toast/toast': {
            toast: { error: (value) => notifications.push(value) },
        },
        '/@/shared/types/features-types': features,
    });
    // Use the real controller method without initializing unrelated endpoint modules.
    const controllerPath = 'src/renderer/api/subsonic/subsonic-controller.ts';
    const controllerSource = readFileSync(
        new URL(`../../${controllerPath}`, import.meta.url),
        'utf8',
    );
    const ast = ts.createSourceFile(controllerPath, controllerSource, ts.ScriptTarget.Latest, true);
    let method;
    const visit = (node) => {
        if (ts.isPropertyAssignment(node) && node.name.getText(ast) === 'getStructuredLyrics')
            method = node.initializer.getText(ast);
        ts.forEachChild(node, visit);
    };
    visit(ast);
    assert.ok(method);
    const getStructuredLyrics = vm.runInNewContext(
        ts.transpileModule(`const method = ${method}; method;`, {
            compilerOptions: { target: ts.ScriptTarget.ES2022 },
        }).outputText,
        {
            ...api,
            ...lyrics,
            ...load('src/renderer/api/subsonic/subsonic-structured-lyrics.ts', {
                '/@/renderer/utils/utf8-byte-slice': load('src/renderer/utils/utf8-byte-slice.ts'),
            }),
            hasFeatureWithVersion: (_server, _feature, version) => version === 1,
            ServerFeature: features.ServerFeature,
        },
    );
    let branch = features.ServerFeature.LYRICS_MULTIPLE_STRUCTURED;
    const feature = load('src/renderer/features/lyrics/api/lyrics-api.ts', {
        '/@/renderer/api': {
            api: {
                controller: {
                    getLyrics: async (args) => {
                        const result = await api
                            .ssApiClient({ ...args.apiClientProps, server: currentServer })
                            .getStructuredLyrics({ query: { id: args.query.songId } });
                        if (result.status !== 200) throw new Error('Lyrics unavailable');
                        return 'valid lyrics';
                    },
                    getStructuredLyrics: (args) =>
                        getStructuredLyrics({
                            ...args,
                            apiClientProps: { ...args.apiClientProps, server: currentServer },
                        }),
                },
            },
        },
        '/@/renderer/api/query-keys': {},
        '/@/renderer/features/lyrics/api/lyrics-utils': {},
        '/@/renderer/lib/react-query': {},
        '/@/renderer/store': { getServerById: () => currentServer, useSettingsStore: {} },
        '/@/shared/api/utils': { hasFeature: (_server, feature) => feature === branch },
        '/@/shared/types/domain-types': {},
        '/@/shared/types/features-types': features,
        '/@/shared/utils/lyrics': lyrics,
        'is-electron': () => false,
    });
    const fetch = () =>
        feature.fetchLocalLyrics({
            serverId: 'test',
            signal: new AbortController().signal,
            song: { id: 'obsolete-song', name: 'saved song' },
        });
    for (const type of [
        features.ServerFeature.LYRICS_MULTIPLE_STRUCTURED,
        features.ServerFeature.LYRICS_SINGLE_STRUCTURED,
    ]) {
        branch = type;
        assert.equal(await fetch(), null);
        assert.equal(
            notifications.length,
            0,
            'optional startup metadata must not toast for a missing saved track',
        );
    }
    const explicit = await api
        .ssApiClient({ server: currentServer })
        .getStructuredLyrics({ query: { id: 'obsolete-song' } });
    assert.equal(explicit.status, 70);
    assert.equal(notifications.length, 1, 'explicit requests must still report ordinary errors');
    errorCode = 40;
    await fetch();
    assert.equal(
        authFailures.length,
        1,
        'silent optional metadata must still surface expired credentials',
    );
    errorCode = 0;
    assert.equal((await fetch()).lyrics, 'valid lyrics');
    branch = features.ServerFeature.LYRICS_MULTIPLE_STRUCTURED;
    assert.equal(await fetch(), null);
    structuredLyrics = [
        { line: [{ start: 1000, value: 'valid structured lyrics' }], synced: true },
    ];
    const result = await fetch();
    assert.equal(result[0].lyrics[0].text, 'valid structured lyrics');
    assert.equal(result[0].lyrics[0].startMs, 1000);
    assert.equal(
        notifications.length,
        1,
        'only the explicit failed request displayed an ordinary error',
    );
    assert.ok(
        requests.length >= 6 && requests.every((path) => path === '/rest/getLyricsBySongId.view'),
    );
});
