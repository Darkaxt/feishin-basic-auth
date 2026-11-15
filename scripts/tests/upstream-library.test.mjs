/* eslint-disable @typescript-eslint/explicit-function-return-type -- Execute production callbacks in isolated Node fixtures. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const expression = (path, name, variable = false) => {
    const ast = ts.createSourceFile(path, source(path), ts.ScriptTarget.Latest, true);
    let found;
    const visit = (node) => {
        if (
            (variable ? ts.isVariableDeclaration(node) : ts.isPropertyAssignment(node)) &&
            node.name.getText(ast) === name &&
            ts.isArrowFunction(node.initializer)
        )
            found = node.initializer.getText(ast);
        ts.forEachChild(node, visit);
    };
    visit(ast);
    assert.ok(found, `${path}:${name}`);
    return (
        ts.transpileModule(`const callback = ${found};`, {
            compilerOptions: { target: ts.ScriptTarget.ES2022 },
        }).outputText + '\ncallback'
    );
};
const plain = (value) => JSON.parse(JSON.stringify(value));
const ndFile = 'src/renderer/api/navidrome/navidrome-controller.ts';

test('Navidrome random songs retain every selected folder and send the genre name', async () => {
    let request;
    const getRandomSongs = vm.runInNewContext(expression(ndFile, 'getRandomSongList'), {
        ssApiClient: () => ({
            getRandomSongListMultipleFolderIds: async (args) => {
                request = plain(args.query);
                return { body: { randomSongs: { song: [{ id: 'a' }] } }, status: 200 };
            },
        }),
        ssNormalize: { song: (song, server) => ({ ...song, server: server.id }) },
    });
    const result = await getRandomSongs({
        apiClientProps: { server: { id: 'nd' } },
        query: {
            genre: { id: 'internal-id', name: 'New Age' },
            limit: 12,
            maxYear: 2026,
            minYear: 1990,
            musicFolderId: ['one', 'two'],
        },
    });
    assert.deepEqual(request, {
        fromYear: 1990,
        genre: 'New Age',
        musicFolderId: ['one', 'two'],
        size: 12,
        toYear: 2026,
    });
    assert.deepEqual(plain(result), {
        items: [{ id: 'a', server: 'nd' }],
        startIndex: 0,
        totalRecordCount: 1,
    });
});

test('Navidrome random-song errors reject instead of acknowledging an empty result', async () => {
    const callback = vm.runInNewContext(expression(ndFile, 'getRandomSongList'), {
        ssApiClient: () => ({ getRandomSongListMultipleFolderIds: async () => ({ status: 500 }) }),
    });
    await assert.rejects(callback({ apiClientProps: {}, query: {} }), /Failed to get random songs/);
});

test('Navidrome multi-folder search propagates filters, pagination and disabled result kinds', async () => {
    const calls = [];
    const apiClientProps = { server: { id: 'nd' } };
    const makeList = (kind) => async (args) => {
        calls.push({ kind, ...plain(args) });
        return { items: [kind] };
    };
    const callback = vm.runInNewContext(expression(ndFile, 'search'), {
        AlbumArtistListSort: { NAME: 'artist-name' },
        AlbumListSort: { NAME: 'album-name' },
        NavidromeController: {
            getAlbumArtistList: makeList('artists'),
            getAlbumList: makeList('albums'),
            getSongList: makeList('songs'),
        },
        SongListSort: { NAME: 'song-name' },
        SortOrder: { ASC: 'asc' },
        SubsonicController: {
            search: () => assert.fail('multi-folder search must retain its native filters'),
        },
    });
    const result = await callback({
        apiClientProps,
        query: {
            albumArtistLimit: 0,
            albumLimit: 7,
            albumStartIndex: 4,
            musicFolderId: ['1', '3'],
            query: 'piano',
            songStartIndex: 2,
        },
    });
    assert.deepEqual(plain(result), { albumArtists: [], albums: ['albums'], songs: ['songs'] });
    assert.deepEqual(
        calls.map((call) => call.kind),
        ['albums', 'songs'],
    );
    assert.deepEqual(calls[0].query, {
        limit: 7,
        musicFolderId: ['1', '3'],
        searchTerm: 'piano',
        sortBy: 'album-name',
        sortOrder: 'asc',
        startIndex: 4,
    });
    assert.equal(calls[1].query.limit, 20);
    assert.equal(calls[1].query.startIndex, 2);
    assert.deepEqual(calls[1].query.musicFolderId, ['1', '3']);
});

test('Navidrome single-folder searches retain the authenticated Subsonic path', async () => {
    const received = [];
    const callback = vm.runInNewContext(expression(ndFile, 'search'), {
        SubsonicController: {
            search: async (args) => {
                received.push(args);
                return 'subsonic';
            },
        },
    });
    for (const musicFolderId of [undefined, '1', ['1']]) {
        const args = { apiClientProps: { server: { id: 'nd' } }, query: { musicFolderId } };
        assert.equal(await callback(args), 'subsonic');
        assert.equal(received.at(-1), args);
    }
});

test('remote lyric search handles absent artist arrays and uses available metadata', async () => {
    let query;
    const callback = vm.runInNewContext(
        expression('src/main/features/core/lyrics/index.ts', 'getRemoteLyrics', true),
        {
            lyricCache: { get: () => undefined },
            searchAllSources: async (params) => {
                query = plain(params);
                return [];
            },
            store: { get: () => [] },
        },
    );
    for (const [metadata, expected] of [
        [{ artistName: 'Other', artists: [{ name: 'Primary' }] }, 'Primary'],
        [{ artistName: 'Track artist', artists: [] }, 'Track artist'],
        [{ albumArtistName: 'Album artist' }, 'Album artist'],
        [{}, undefined],
    ]) {
        assert.equal(
            await callback({ duration: 180000, id: 'a', name: 'Track', ...metadata }),
            null,
        );
        assert.equal(query.artist, expected);
        assert.equal(query.duration, 180);
        assert.equal(query.album, 'Track');
        if (expected === undefined) assert.equal(Object.hasOwn(query, 'artist'), false);
    }
});

test('shuffle migration clears obsolete string genres without losing valid selection objects', () => {
    const callback = vm.runInNewContext(
        expression('src/renderer/features/player/components/shuffle-all-modal.tsx', 'migrate'),
    );
    assert.deepEqual(callback({ genre: 'old-name', limit: 12, musicFolderId: ['1'] }, 2), {
        genre: undefined,
        limit: 12,
        musicFolderId: ['1'],
    });
    const current = { genre: { id: 'g', name: 'Jazz' } };
    assert.equal(callback(current, 3), current);
    assert.deepEqual(current.genre, { id: 'g', name: 'Jazz' });
    assert.equal(callback(undefined, 1), undefined);
});

test('browser initialization preserves jukebox while replacing desktop-only engines', () => {
    const text = source('src/renderer/layouts/default-layout.tsx');
    const start = text.indexOf('const WEB_PLAYBACK_TYPES');
    const end = text.indexOf('export ', start);
    assert.ok(start >= 0 && end > start);
    for (const desktop of [false, true])
        for (const type of ['web', 'jukebox', 'mpv', 'dlna']) {
            let selected = type;
            const code = ts.transpileModule(text.slice(start, end), {
                compilerOptions: { target: ts.ScriptTarget.ES2022 },
            }).outputText;
            vm.runInNewContext(code, {
                isElectron: () => desktop,
                PlayerType: { JUKEBOX: 'jukebox', WEB: 'web' },
                useSettingsStore: {
                    getState: () => ({
                        actions: {
                            setSettings: (value) => {
                                selected = value.playback.type;
                            },
                        },
                        playback: { type },
                    }),
                },
            });
            assert.equal(selected, desktop || ['jukebox', 'web'].includes(type) ? type : 'web');
        }
});

test('next album in a one-album repeating queue never installs index minus one', () => {
    const state = {
        getQueueOrder: () => ({ items: [{ albumId: 'a' }, { albumId: 'a' }] }),
        player: { index: 1, repeat: 'all', status: 'paused' },
        queue: { shuffled: [] },
    };
    const events = [];
    const callback = vm.runInNewContext(
        expression('src/renderer/store/player.store.ts', 'mediaNext'),
        {
            calculateNextIndex: () => ({ nextIndex: 0, shouldStop: false }),
            eventEmitter: { emit: (name, value) => events.push({ name, value }) },
            findLastAlbumRange: () => [0, 1],
            get: () => state,
            isShuffleEnabled: () => false,
            PlayerRepeat: { ONE: 'one' },
            PlayerStatus: { PLAYING: 'playing', STOPPED: 'stopped' },
            set: (change) => change(state),
            setTimestampStore: () => {},
            syncUpNext: () => {},
        },
    );
    callback(true);
    assert.equal(state.player.index, 0);
    assert.equal(events.at(-1).value.nextIndex, 0);
});
