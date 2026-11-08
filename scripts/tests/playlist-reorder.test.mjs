/* eslint-disable @typescript-eslint/explicit-function-return-type -- Production callback regression fixture. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const content = 'src/renderer/features/playlists/components/playlist-detail-song-list-content.tsx';
const column =
    'src/renderer/components/item-list/item-table-list/columns/playlist-reorder-column.tsx';
const row = 'src/renderer/components/item-list/item-table-list/hooks/use-item-drag-drop-state.tsx';
const header =
    'src/renderer/features/playlists/components/playlist-detail-song-list-header-filters.tsx';

const expression = (file, name, context) => {
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let value;
    const visit = (node) => {
        if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name)
            value = node.initializer.getText(ast);
        if (
            name === 'dragOptions' &&
            ts.isCallExpression(node) &&
            node.expression.getText(ast) === 'useDragDrop'
        )
            value = node.arguments[0].getText(ast);
        ts.forEachChild(node, visit);
    };
    visit(ast);
    assert.ok(value, `${file}: ${name}`);
    const code = ts.transpileModule(`const result = ${value};`, {
        compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText;
    return vm.runInNewContext(`${code}\nresult`, context);
};

const fixture = (selectedIndexes = [2]) => {
    const items = [
        { id: 'song-a', playlistItemId: 'entry-a1' },
        { id: 'song-b', playlistItemId: 'entry-b' },
        { id: 'song-a', playlistItemId: 'entry-a2' },
        { id: 'song-c', playlistItemId: 'entry-c' },
    ];
    let data = { items };
    const selected = selectedIndexes.map((index) => items[index]);
    const internalState = {
        extractRowId: (item) => item.playlistItemId || item.id,
        getData: () => data.items,
        setDragging: () => {},
    };
    const events = [];
    const handleReorder = expression(content, 'handleReorder', {
        playlistId: 'playlist',
        setLocalData: (update) => {
            data = update(data);
        },
    });
    const context = {
        DragOperation: { ADD: 'add', REORDER: 'reorder' },
        DragTarget: { GENERIC: 'generic', QUEUE_SONG: 'queue-song', SONG: 'song' },
        DragTargetMap: {},
        eventEmitter: {
            emit: (name, payload) => {
                events.push({ name, payload });
                handleReorder(payload);
            },
        },
        getDraggedItems: () => selected,
        getValidDataItems: () => data.items,
        internalState,
        isDataRow: true,
        isPlaylistSong: true,
        item: selected[0],
        itemType: 'playlist-song',
        LibraryItem: { PLAYLIST_SONG: 'playlist-song', QUEUE_SONG: 'queue-song' },
        needsDropRegistration: true,
        playerContext: {},
        playlistId: 'playlist',
        props: { internalState },
        shouldEnableDrag: true,
        useCallback: (callback) => callback,
    };
    return {
        context,
        events,
        handleReorder,
        items,
        order: () => Array.from(data.items, (item) => item.playlistItemId || item.id),
        saveIds: () =>
            Array.from(
                expression(header, 'tracks', { listData: data.items, useMemo: (read) => read() }),
            ),
    };
};

test('reorder handler preserves separate occurrences and duplicate IDs in the save payload', () => {
    const state = fixture();
    state.handleReorder({
        edge: 'bottom',
        playlistId: 'playlist',
        sourceIds: ['entry-a2'],
        targetId: 'entry-c',
    });
    assert.deepEqual(state.order(), ['entry-a1', 'entry-b', 'entry-c', 'entry-a2']);
    assert.deepEqual(state.saveIds(), ['song-a', 'song-b', 'song-c', 'song-a']);
    state.handleReorder({
        edge: 'bottom',
        playlistId: 'other',
        sourceIds: ['entry-a1'],
        targetId: 'entry-c',
    });
    assert.deepEqual(state.order(), ['entry-a1', 'entry-b', 'entry-c', 'entry-a2']);
});

for (const [name, expected] of [
    ['handleMoveUp', ['entry-a1', 'entry-a2', 'entry-b', 'entry-c']],
    ['handleMoveDown', ['entry-a1', 'entry-b', 'entry-c', 'entry-a2']],
    ['handleMoveToTop', ['entry-a2', 'entry-a1', 'entry-b', 'entry-c']],
    ['handleMoveToBottom', ['entry-a1', 'entry-b', 'entry-c', 'entry-a2']],
]) {
    test(`${name} moves the selected occurrence without losing another copy`, () => {
        const state = fixture();
        expression(column, name, state.context)();
        assert.equal(state.events.length, 1);
        assert.deepEqual(state.order(), expected);
        assert.equal(state.saveIds().filter((id) => id === 'song-a').length, 2);
    });
}

for (const file of [column, row]) {
    test(`${file.split('/').at(-1)} drops retain occurrence identity`, () => {
        const state = fixture();
        const options = expression(file, 'dragOptions', { ...state.context, item: state.items[3] });
        options.drop.onDrop({
            edge: 'bottom',
            self: { itemType: 'playlist-song' },
            source: {
                id: ['song-a'],
                item: [state.items[2]],
                itemType: 'playlist-song',
                metadata: { fromReorderHandle: true },
            },
        });
        assert.deepEqual(state.order(), ['entry-a1', 'entry-b', 'entry-c', 'entry-a2']);
        assert.deepEqual(state.saveIds(), ['song-a', 'song-b', 'song-c', 'song-a']);
    });
}

test('multiple selected occurrences retain their order and complete save payload', () => {
    const state = fixture([0, 2]);
    expression(column, 'handleMoveToBottom', state.context)();
    assert.deepEqual(state.order(), ['entry-b', 'entry-c', 'entry-a1', 'entry-a2']);
    assert.deepEqual(state.saveIds(), ['song-b', 'song-c', 'song-a', 'song-a']);
});

test('unique song IDs remain a valid fallback without playlist entry IDs', () => {
    const state = fixture();
    state.items[2].id = 'song-d';
    for (const item of state.items) delete item.playlistItemId;
    state.handleReorder({
        edge: 'bottom',
        playlistId: 'playlist',
        sourceIds: ['song-b'],
        targetId: 'song-c',
    });
    assert.deepEqual(state.saveIds(), ['song-a', 'song-d', 'song-c', 'song-b']);
});
