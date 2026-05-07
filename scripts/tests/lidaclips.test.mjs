import assert from 'node:assert/strict';
import test from 'node:test';

const lidaClips = await import('../../src/shared/utils/lidaclips.ts');

test('buildLidaClipsLookupUrl constructs the metadata tuple query', () => {
    const url = lidaClips.buildLidaClipsLookupUrl('https://clips.example.test/', {
        album: 'A Thousand Suns',
        artist: 'Linkin Park',
        track: 'Waiting for the End',
    });

    assert.equal(
        url,
        'https://clips.example.test/api/v1/clips?artist=Linkin+Park&album=A+Thousand+Suns&track=Waiting+for+the+End',
    );
});

test('buildLidaClipsLookupUrl preserves a base URL path prefix', () => {
    const url = lidaClips.buildLidaClipsLookupUrl('https://example.test/clips/', {
        album: '2CELLOS',
        artist: '2CELLOS',
        track: 'Fragile',
    });

    assert.equal(
        url,
        'https://example.test/clips/api/v1/clips?artist=2CELLOS&album=2CELLOS&track=Fragile',
    );
});

test('resolveLidaClipsResourceUrl keeps root-relative API paths under the configured base', () => {
    assert.equal(
        lidaClips.resolveLidaClipsResourceUrl('https://example.test/clips', '/api/v1/stream/1'),
        'https://example.test/clips/api/v1/stream/1',
    );
    assert.equal(
        lidaClips.resolveLidaClipsResourceUrl(
            'https://example.test/clips',
            '/clips/api/v1/stream/1',
        ),
        'https://example.test/clips/api/v1/stream/1',
    );
    assert.throws(() =>
        lidaClips.resolveLidaClipsResourceUrl(
            'https://example.test/clips',
            'https://media.example.test/api/v1/stream/1',
        ),
    );
});

test('createLidaClipsLookupQueryFromSong uses artistName album and name', () => {
    const query = lidaClips.createLidaClipsLookupQueryFromSong({
        album: 'A Thousand Suns',
        artistName: 'Linkin Park',
        name: 'Iridescent',
        path: 'Linkin Park/A Thousand Suns/12 - Iridescent.flac',
    });

    assert.deepEqual(query, {
        album: 'A Thousand Suns',
        artist: 'Linkin Park',
        track: 'Iridescent',
    });
});

test('createLidaClipsProxyAuthSourceFromServer reuses the server proxy secret', () => {
    assert.deepEqual(
        lidaClips.createLidaClipsProxyAuthSourceFromServer({
            id: 'oracle',
            proxyAuth: {
                enabled: true,
                type: 'basic',
                username: 'proxy-user',
            },
        }),
        {
            enabled: true,
            secretKey: 'proxy-basic-auth:oracle',
            username: 'proxy-user',
        },
    );
    assert.equal(
        lidaClips.createLidaClipsProxyAuthSourceFromServer({
            id: 'oracle',
            proxyAuth: {
                enabled: false,
                type: 'basic',
                username: 'proxy-user',
            },
        }),
        undefined,
    );
});

test('LidaClips does not define a dedicated proxy password secret', () => {
    assert.equal('LIDACLIPS_PROXY_PASSWORD_SECRET_KEY' in lidaClips, false);
});

test('rankLidaClips prefers official, then score, then newest update', () => {
    const newestFallback = {
        id: 1,
        quality_tier: 'fallback',
        score: 100,
        updated_at: '2026-05-07T00:00:00Z',
    };
    const olderOfficial = {
        id: 2,
        quality_tier: 'official',
        score: 70,
        updated_at: '2026-05-01T00:00:00Z',
    };

    assert.equal(lidaClips.rankLidaClips([newestFallback, olderOfficial])?.id, 2);
    assert.equal(
        lidaClips.rankLidaClips([
            { ...newestFallback, id: 3, score: 50 },
            { ...newestFallback, id: 4, score: 95 },
        ])?.id,
        4,
    );
    assert.equal(
        lidaClips.rankLidaClips([
            { ...newestFallback, id: 5, updated_at: '2026-05-01T00:00:00Z' },
            { ...newestFallback, id: 6, updated_at: '2026-05-08T00:00:00Z' },
        ])?.id,
        6,
    );
});

test('shouldShowLidaClipsTab hides the tab when disabled', () => {
    assert.equal(lidaClips.shouldShowLidaClipsTab({ enabled: false }), false);
    assert.equal(lidaClips.shouldShowLidaClipsTab({ enabled: true }), true);
});

test('getLidaClipsFallbackTab prefers visualizer when web audio is available', () => {
    assert.equal(lidaClips.getLidaClipsFallbackTab({ webAudio: true }), 'visualizer');
    assert.equal(lidaClips.getLidaClipsFallbackTab({ webAudio: false }), 'queue');
});

test('getLidaClipsPlaybackDecision keeps clip mode sticky across clip and fallback states', () => {
    assert.deepEqual(
        lidaClips.getLidaClipsPlaybackDecision({
            clipModeActive: true,
            lookupStatus: 'ok',
            webAudio: true,
        }),
        {
            clipModeActive: true,
            playerAction: 'pauseAudio',
            shouldAutoplayClip: true,
            tab: 'clips',
        },
    );

    assert.deepEqual(
        lidaClips.getLidaClipsPlaybackDecision({
            clipModeActive: true,
            lookupStatus: 'no-match',
            webAudio: true,
        }),
        {
            clipModeActive: true,
            playerAction: 'playAudio',
            shouldAutoplayClip: false,
            tab: 'visualizer',
        },
    );
});

test('shouldExitLidaClipsModeForTab exits only when leaving clip playback surfaces', () => {
    assert.equal(lidaClips.shouldExitLidaClipsModeForTab('clips'), false);
    assert.equal(lidaClips.shouldExitLidaClipsModeForTab('visualizer'), false);
    assert.equal(lidaClips.shouldExitLidaClipsModeForTab('queue'), true);
    assert.equal(lidaClips.shouldExitLidaClipsModeForTab('related'), true);
    assert.equal(lidaClips.shouldExitLidaClipsModeForTab('lyrics'), true);
});

test('shouldPauseAfterAutoNext keeps audio paused for clip-mode queue advancement', () => {
    assert.equal(
        lidaClips.shouldPauseAfterAutoNext({
            keepPaused: true,
            pauseOnNext: false,
            shouldPause: false,
        }),
        true,
    );
    assert.equal(
        lidaClips.shouldPauseAfterAutoNext({
            keepPaused: false,
            pauseOnNext: false,
            shouldPause: false,
        }),
        false,
    );
    assert.equal(
        lidaClips.shouldPauseAfterAutoNext({
            keepPaused: false,
            pauseOnNext: true,
            shouldPause: false,
        }),
        true,
    );
});

test('shouldStopLidaClipsModeAfterAutoNext stops only at queue boundaries or pause-on-next', () => {
    assert.equal(
        lidaClips.shouldStopLidaClipsModeAfterAutoNext({
            hasNextSong: true,
            pauseOnNext: false,
        }),
        false,
    );
    assert.equal(
        lidaClips.shouldStopLidaClipsModeAfterAutoNext({
            hasNextSong: false,
            pauseOnNext: false,
        }),
        true,
    );
    assert.equal(
        lidaClips.shouldStopLidaClipsModeAfterAutoNext({
            hasNextSong: true,
            pauseOnNext: true,
        }),
        true,
    );
});

test('redactLidaClipsSecretsFromText removes API keys and proxy credentials', () => {
    const text =
        'X-Api-Key: secret-123 Authorization: ' +
        'Basic ' +
        'cHJveHk6c2VjcmV0 ' +
        'https://' +
        'user:pass@clips.example.test/api/v1/clips?api_key=secret-456';

    assert.equal(
        lidaClips.redactLidaClipsSecretsFromText(text),
        'X-Api-Key: <redacted> Authorization: Basic <redacted> https://<proxy-auth>@clips.example.test/api/v1/clips?api_key=<redacted>',
    );
});

test('selectLidaClipsStreamRequestHeaders forwards Range without secrets', () => {
    const headers = lidaClips.selectLidaClipsStreamRequestHeaders({
        Authorization: 'Basic should-not-forward',
        'if-range': '"etag"',
        Range: 'bytes=100-200',
        'User-Agent': 'Feishin',
        'X-Api-Key': 'should-not-forward',
    });

    assert.deepEqual(headers, {
        'if-range': '"etag"',
        range: 'bytes=100-200',
    });
});
