/* eslint-disable @typescript-eslint/explicit-function-return-type -- Node runs these JavaScript tests directly. */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const lyricUtils = await import('../../src/shared/utils/lyrics.ts');

function loadSource(path, mocks = {}, globals = {}) {
    const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            esModuleInterop: true,
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.CommonJS,
        },
        fileName: path,
    });
    const module = { exports: {} };
    vm.runInNewContext(
        outputText,
        {
            exports: module.exports,
            module,
            ...globals,
            require: (id) => {
                if (id in mocks) return mocks[id];
                if (id.startsWith('/@/shared/components/') || id === '/@/i18n/i18n') return {};
                if (id.startsWith('/@/')) throw new Error(`Missing test dependency: ${id}`);
                return require(id);
            },
        },
        { filename: path },
    );
    return module.exports;
}

test('lyrics events reach subscribers once and detach on unmount', () => {
    const emitter = new EventEmitter();
    let cleanup;
    const { usePlayerEvents } = loadSource(
        'src/renderer/features/player/audio-player/hooks/use-player-events.ts',
        {
            '/@/renderer/events/event-emitter': { eventEmitter: emitter },
            '/@/renderer/store': {},
            react: {
                useEffect: (effect) => {
                    cleanup = effect();
                },
            },
        },
    );
    const received = [];
    usePlayerEvents({ onPlayerLyricsFetched: (payload) => received.push(payload) }, []);
    const payload = { lyrics: { lyrics: 'line' }, offsetMs: 12, synced: false };
    emitter.emit('PLAYER_LYRICS_FETCHED', payload);
    assert.deepEqual(received, [payload]);
    cleanup();
    emitter.emit('PLAYER_LYRICS_FETCHED', payload);
    assert.equal(received.length, 1);
    assert.equal(emitter.listenerCount('PLAYER_LYRICS_FETCHED'), 0);
});

test('MPV startup preserves queued resume and gates controls until ready', async () => {
    for (const cancelled of [false, true]) {
        const effects = [];
        const calls = [];
        let playerEvents;
        let resolveInitialization;
        let signalStarted;
        let initialized = false;
        const started = new Promise((resolve) => {
            signalStarted = resolve;
        });
        const initialization = new Promise((resolve) => {
            resolveInitialization = resolve;
        });
        const mpv = {
            initialize: () => {
                signalStarted();
                return initialization;
            },
            isRunning: async () => false,
            mute: () => calls.push('mute'),
            pause: () => calls.push('pause'),
            play: () => calls.push('play'),
            quit: () => calls.push('quit'),
            setProperties: () => calls.push('properties'),
            setQueue: (...args) => {
                calls.push(args);
                return Promise.resolve(true);
            },
            volume: () => calls.push('volume'),
        };
        const queueSync = await import('../../src/shared/utils/mpv-queue-sync.ts');
        const restore = await import('../../src/shared/utils/playback-restore.ts');
        const currentSong = { _uniqueId: 'song-1', id: 'song-1' };
        const store = {
            setMpvInitialized: (ready) => {
                initialized = ready;
            },
            useMpvInitialized: () => initialized,
            usePlaybackSettings: () => ({ transcode: {} }),
            usePlayerActions: () => ({}),
            usePlayerHydrated: () => true,
            usePlayerSong: () => currentSong,
            usePlayerStore: {
                getState: () => ({ getPlayerData: () => ({ currentSong, status: 'paused' }) }),
            },
            useSettingsStore: (select) =>
                select({ playback: { mpvExtraParameters: [], mpvProperties: {} } }),
            useTimestampStoreBase: { getState: () => ({ timestamp: 96 }) },
        };
        store.useSettingsStore.getState = () => ({ playback: {} });
        const { MpvPlayerEngine } = loadSource(
            'src/renderer/features/player/audio-player/engine/mpv-player-engine.tsx',
            {
                '/@/renderer/events/event-emitter': {},
                '/@/renderer/features/player/audio-player/hooks/use-player-events': {
                    usePlayerEvents: (value) => {
                        playerEvents = value;
                    },
                },
                '/@/renderer/features/player/audio-player/hooks/use-stream-url': {
                    getSongUrl: async () => 'stream',
                },
                '/@/renderer/features/radio/hooks/use-radio-player': {
                    useRadioStore: { getState: () => ({}) },
                },
                '/@/renderer/features/settings/components/playback/mpv-audio-filters': {
                    buildMpvAudioFilters: () => '',
                },
                '/@/renderer/features/settings/components/playback/mpv-properties': {
                    getMpvProperties: () => ({}),
                },
                '/@/renderer/store': store,
                '/@/renderer/store/full-screen-player.store': {},
                '/@/shared/types/types': { PlayerStatus: { PLAYING: 'playing' } },
                '/@/shared/utils/lidaclips': {},
                '/@/shared/utils/mpv-queue-sync': queueSync,
                '/@/shared/utils/playback-restore': restore,
                'is-electron': () => true,
                react: {
                    useEffect: (fn) => effects.push(fn),
                    useImperativeHandle: () => {},
                    useRef: (current) => ({ current }),
                    useState: (value) => [value, () => {}],
                },
                'react/jsx-runtime': { jsx: () => null },
            },
            { queueMicrotask, window: { api: { mpvPlayer: mpv } } },
        );
        MpvPlayerEngine({ playerStatus: 'paused', speed: 1, volume: 75 });
        const cleanup = effects[1]();
        await started;
        for (const effect of effects.slice(2, 7)) effect();
        assert.deepEqual(calls, []);
        playerEvents.onPlayerPlay({ id: 'song-1', index: 0 });
        if (cancelled) cleanup();
        resolveInitialization();
        await new Promise(setImmediate);
        assert.equal(initialized, !cancelled);
        assert.deepEqual(calls, cancelled ? ['quit'] : [['stream', undefined, true, 96]]);
        if (!cancelled) cleanup();
    }
});

test('MPV waits for persisted player hydration before startup queue sync', async () => {
    const effects = [];
    const calls = [];
    let initialized = false;
    const mpv = {
        initialize: async () => calls.push('initialize'),
        isRunning: async () => false,
        quit: () => calls.push('quit'),
        setProperties: () => calls.push('properties'),
        setQueue: () => {
            calls.push('queue');
            return Promise.resolve(true);
        },
    };
    const store = {
        setMpvInitialized: (ready) => {
            initialized = ready;
        },
        useMpvInitialized: () => initialized,
        usePlaybackSettings: () => ({ transcode: {} }),
        usePlayerActions: () => ({}),
        usePlayerHydrated: () => false,
        usePlayerSong: () => undefined,
        usePlayerStore: {
            getState: () => ({
                getPlayerData: () => ({ currentSong: undefined, status: 'paused' }),
            }),
        },
        useSettingsStore: (select) =>
            select({ playback: { mpvExtraParameters: [], mpvProperties: {} } }),
        useTimestampStoreBase: { getState: () => ({ timestamp: 96 }) },
    };
    store.useSettingsStore.getState = () => ({ playback: {} });
    const { MpvPlayerEngine } = loadSource(
        'src/renderer/features/player/audio-player/engine/mpv-player-engine.tsx',
        {
            '/@/renderer/events/event-emitter': {},
            '/@/renderer/features/player/audio-player/hooks/use-player-events': {
                usePlayerEvents: () => {},
            },
            '/@/renderer/features/player/audio-player/hooks/use-stream-url': {
                getSongUrl: async () => undefined,
            },
            '/@/renderer/features/radio/hooks/use-radio-player': {
                useRadioStore: { getState: () => ({}) },
            },
            '/@/renderer/features/settings/components/playback/mpv-audio-filters': {
                buildMpvAudioFilters: () => '',
            },
            '/@/renderer/features/settings/components/playback/mpv-properties': {
                getMpvProperties: () => ({}),
            },
            '/@/renderer/store': store,
            '/@/renderer/store/full-screen-player.store': {},
            '/@/shared/types/types': { PlayerStatus: { PLAYING: 'playing' } },
            '/@/shared/utils/lidaclips': {},
            '/@/shared/utils/mpv-queue-sync':
                await import('../../src/shared/utils/mpv-queue-sync.ts'),
            '/@/shared/utils/playback-restore':
                await import('../../src/shared/utils/playback-restore.ts'),
            'is-electron': () => true,
            react: {
                useEffect: (fn) => effects.push(fn),
                useImperativeHandle: () => {},
                useRef: (current) => ({ current }),
                useState: (value) => [value, () => {}],
            },
            'react/jsx-runtime': { jsx: () => null },
        },
        { queueMicrotask, window: { api: { mpvPlayer: mpv } } },
    );

    MpvPlayerEngine({ playerStatus: 'paused', speed: 1, volume: 75 });
    const cleanup = effects[1]();
    await new Promise(setImmediate);
    const initializedBeforeHydration = calls.includes('initialize');
    cleanup?.();

    assert.equal(initializedBeforeHydration, false);
});

function loadLyricsExport(formValues) {
    const utils = loadSource('src/renderer/features/lyrics/api/lyrics-utils.ts', {
        '/@/shared/types/domain-types': {},
    });
    let displayed;
    const exports = loadSource('src/renderer/features/lyrics/components/lyrics-export-form.tsx', {
        '/@/renderer/features/lyrics/api/lyrics-utils': utils,
        '/@/shared/hooks/use-form': {
            useForm: () => ({ getInputProps: () => ({}), values: formValues }),
        },
        '/@/shared/utils/lyrics': lyricUtils,
        '@mantine/modals': {},
        react: {
            useCallback: (fn) => fn,
            useMemo: (fn) => {
                displayed = fn();
                return displayed;
            },
        },
        'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
        'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
    });
    return { ...exports, displayed: () => displayed };
}

test('shared LRC serialization preserves translated lines and offsets', () => {
    const { lyricsMetadataToLrc } = loadLyricsExport({});
    const lyrics = {
        artist: 'Artist',
        lyrics: [{ startMs: 1000, text: 'Original\nTranslation' }],
        name: 'Track',
        offsetMs: 50,
    };
    assert.match(lyricsMetadataToLrc(lyrics, 150, true), /\[offset:200\]/);
    assert.match(lyricsMetadataToLrc(lyrics, 150, true), /Original\nTranslation/);
    assert.equal(lyricsMetadataToLrc(lyrics, 0, false), 'Original\nTranslation\n');
});

test('export preview uses edited form values instead of initial props', () => {
    const form = loadLyricsExport({ offsetMs: 300, synced: false });
    const lyrics = { artist: 'Artist', lyrics: [{ startMs: 1000, text: 'Line' }], name: 'Track' };
    form.LyricsExportForm({ lyrics, offsetMs: 0, synced: true });
    assert.equal(form.displayed(), 'Line\n');
    const syncedForm = loadLyricsExport({ offsetMs: 300, synced: true });
    syncedForm.LyricsExportForm({ lyrics, offsetMs: 0, synced: true });
    assert.match(syncedForm.displayed(), /\[offset:300\]/);
});

test('song changes clear stale seeks without resetting a mounted restored song', () => {
    let callbacks;
    let state = { player: { seekToTimestamp: '96-restored' } };
    const { useUpdateCurrentSong } = loadSource(
        'src/renderer/features/player/hooks/use-update-current-song.ts',
        {
            '/@/renderer/api': {},
            '/@/renderer/api/query-keys': {},
            '/@/renderer/features/player/audio-player/hooks/use-player-events': {
                usePlayerEvents: (value) => {
                    callbacks = value;
                },
            },
            '/@/renderer/store/player.store': {
                uniqueSeekToTimestamp: (value) => `${value}-new`,
                usePlayerActions: () => ({}),
                usePlayerHydrated: () => true,
                usePlayerSong: () => undefined,
                usePlayerStoreBase: { setState: (update) => update(state) },
            },
            '/@/renderer/utils/logger': {},
            '/@/shared/utils/song-availability': {},
            '@tanstack/react-query': { useQueryClient: () => ({}) },
            react: { useCallback: (fn) => fn, useEffect: (fn) => fn() },
        },
    );
    useUpdateCurrentSong();
    assert.equal(state.player.seekToTimestamp, '96-restored');
    const previous = { song: { _uniqueId: 'a1', id: 'a' } };
    callbacks.onCurrentSongChange({ song: { ...previous.song, name: 'Refreshed' } }, previous);
    assert.equal(state.player.seekToTimestamp, '96-restored');
    callbacks.onCurrentSongChange({ song: { _uniqueId: 'b1', id: 'b' } }, previous);
    assert.equal(state.player.seekToTimestamp, '0-new');
});

test('desktop panel predicates include clips and exclude mobile-only tabs', () => {
    for (const [path, name] of [
        [
            'src/renderer/features/player/components/full-screen-player-queue.tsx',
            'isDesktopPanelOpen',
        ],
        ['src/renderer/features/player/components/full-screen-player.tsx', 'hasActiveModule'],
    ]) {
        const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
        const ast = ts.createSourceFile(
            path,
            source,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX,
        );
        let expression;
        const visit = (node) => {
            if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name)
                expression = node.initializer.getText(ast);
            ts.forEachChild(node, visit);
        };
        visit(ast);
        const code = ts.transpileModule(`const predicate = ${expression};`, {
            compilerOptions: { target: ts.ScriptTarget.ES2022 },
        }).outputText;
        for (const [activeTab, expected] of [
            ['clips', true],
            ['queue', true],
            ['visualizer', true],
            ['player', false],
            ['', false],
        ]) {
            const result = vm.runInNewContext(
                `${code}\ntypeof predicate === 'function' ? predicate(activeTab, true) : predicate`,
                { activeTab },
            );
            assert.equal(result, expected, `${name}: ${activeTab}`);
        }
    }
});
