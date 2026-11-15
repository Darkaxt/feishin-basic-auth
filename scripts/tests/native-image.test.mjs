/* eslint-disable @typescript-eslint/explicit-function-return-type -- Exercise the production hook's fetch lifecycle in Node. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

import { createBasicAuthorizationHeader } from '../../src/shared/utils/proxy-auth.ts';

const source = readFileSync(
    new URL('../../src/shared/components/image/use-native-image.ts', import.meta.url),
    'utf8',
);
const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const load = async (request) => {
    const effects = [];
    const exports = {};
    let fetched;
    let settle;
    const terminal = new Promise((resolve) => {
        settle = resolve;
    });
    vm.runInNewContext(code, {
        AbortController,
        document: { baseURI: 'https://music.example/app/index.html' },
        exports,
        fetch: async (url, init) => {
            // The real Fetch constructor rejects URL userinfo before network dispatch.
            fetched = new Request(url, init);
            return new Response(new Blob(['image'], { type: 'image/png' }));
        },
        Headers,
        require: (name) => {
            if (name === 'react')
                return {
                    useEffect: (effect) => effects.push(effect),
                    useMemo: (read) => read(),
                    useRef: (current) => ({ current }),
                    useState: (initial) => [
                        initial,
                        (next) => {
                            const state = typeof next === 'function' ? next(initial) : next;
                            if (state.status === 'loaded' || state.status === 'error')
                                settle(state);
                        },
                    ],
                };
            assert.equal(name, '/@/shared/utils/proxy-auth');
            return { createBasicAuthorizationHeader };
        },
        URL,
    });
    exports.useNativeImage({ enabled: true, fetchPriority: 'high', request });
    const disposers = effects.map((effect) => effect());
    const state = await terminal;
    for (const dispose of disposers) dispose?.();
    return { fetched, state };
};

test('image fetch accepts encoded URL credentials through the Basic header', async () => {
    const { fetched, state } = await load({
        cacheKey: 'cover',
        headers: { 'X-Test': 'kept' },
        url: 'https://user%40example:p%3Aass%C3%A9@music.example/rest/getCoverArt.view?id=album&size=300',
    });
    assert.equal(state.status, 'loaded');
    assert.equal(fetched.url, 'https://music.example/rest/getCoverArt.view?id=album&size=300');
    assert.equal(
        fetched.headers.get('Authorization'),
        createBasicAuthorizationHeader('user@example', 'p:assé'),
    );
    assert.equal(fetched.headers.get('X-Test'), 'kept');
});

test('an explicit Authorization header takes precedence and the caller headers stay unchanged', async () => {
    const headers = { authorization: 'Bearer explicit' };
    const { fetched, state } = await load({
        cacheKey: 'cover',
        headers,
        url: 'https://user:pass@music.example/cover/',
    });
    assert.equal(state.status, 'loaded');
    assert.equal(fetched.url, 'https://music.example/cover/');
    assert.equal(fetched.headers.get('Authorization'), 'Bearer explicit');
    assert.deepEqual(headers, { authorization: 'Bearer explicit' });
});

test('plain and relative artwork requests preserve their URL and credentials policy', async () => {
    for (const [url, expected] of [
        ['https://music.example/cover?id=a', 'https://music.example/cover?id=a'],
        ['../cover.png', 'https://music.example/cover.png'],
    ]) {
        const { fetched, state } = await load({ cacheKey: url, credentials: 'include', url });
        assert.equal(state.status, 'loaded');
        assert.equal(fetched.url, expected);
        assert.equal(fetched.credentials, 'include');
        assert.equal(fetched.headers.has('Authorization'), false);
    }
});
