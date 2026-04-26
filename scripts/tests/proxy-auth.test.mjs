import { strict as assert } from 'node:assert';
import test from 'node:test';

const proxyAuth = await import('../../src/shared/utils/proxy-auth.ts');

test('sanitizeServerUrl strips URL credentials and preserves the server URL', () => {
    const result = proxyAuth.sanitizeServerUrl('https://proxy-user:p%40ss@example.test/music/');

    assert.deepEqual(result, {
        proxyPassword: 'p@ss',
        proxyUsername: 'proxy-user',
        url: 'https://example.test/music',
    });
});

test('createBasicAuthorizationHeader encodes UTF-8 credentials', () => {
    assert.equal(
        proxyAuth.createBasicAuthorizationHeader('proxy-user', 'p@ss'),
        'Basic cHJveHktdXNlcjpwQHNz',
    );
});

test('getProxyAuthOrigins returns unique configured server origins only', () => {
    const origins = proxyAuth.getProxyAuthOrigins({
        id: 'server-1',
        proxyAuth: {
            enabled: true,
            type: 'basic',
            username: 'proxy-user',
        },
        remoteUrl: 'https://proxy.example.test/public',
        url: 'https://proxy.example.test/music',
    });

    assert.deepEqual(origins, ['https://proxy.example.test']);
});

test('withUrlBasicAuth adds URL credentials for external media clients', () => {
    assert.equal(
        proxyAuth.withUrlBasicAuth(
            'https://proxy.example.test/rest/stream.view?id=1',
            'proxy-user',
            'p@ss',
        ),
        'https://proxy-user:p%40ss@proxy.example.test/rest/stream.view?id=1',
    );
});

test('redactProxyAuthFromText removes Basic headers and URL credentials from diagnostics', () => {
    assert.equal(
        proxyAuth.redactProxyAuthFromText(
            'Authorization: Basic cHJveHk6c2VjcmV0 https://proxy:secret@example.test/rest',
        ),
        'Authorization: Basic <redacted> https://<proxy-auth>@example.test/rest',
    );
});
