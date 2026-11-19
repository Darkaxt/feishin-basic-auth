/* eslint-disable @typescript-eslint/explicit-function-return-type -- Execute production helpers in isolated Node fixtures. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const file = 'src/renderer/features/artists/utils/artist-library-relations.ts';
const code = ts.transpileModule(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(code, { exports: exportsObject });
const { deriveArtistGenresFromAlbums, rankArtistsBySharedGenres } = exportsObject;
const plain = (value) => JSON.parse(JSON.stringify(value));

const artist = (id, name = id) => ({
    id,
    imageId: id,
    imageUrl: null,
    name,
    userFavorite: false,
    userRating: null,
});
const genre = (id) => ({ id, name: id.toUpperCase() });

test('artist genres come from album genres ranked by album count', () => {
    const genres = deriveArtistGenresFromAlbums([
        { genres: [genre('pop'), genre('rock'), genre('pop')] },
        { genres: [genre('rock')] },
        { genres: [genre('rock'), genre('jazz')] },
        { genres: [] },
        {},
    ]);
    assert.deepEqual(plain(genres), [
        { id: 'rock', name: 'ROCK' },
        { id: 'jazz', name: 'JAZZ' },
        { id: 'pop', name: 'POP' },
    ]);
    assert.deepEqual(plain(deriveArtistGenresFromAlbums(undefined)), []);
    assert.equal(
        deriveArtistGenresFromAlbums([{ genres: ['a', 'b', 'c'].map(genre) }], 2).length,
        2,
    );
});

test('related library artists rank by shared genres, excluding self, collaborations and placeholders', () => {
    const related = rankArtistsBySharedGenres(
        [
            { albumArtists: [artist('b')], genres: [genre('rock')] },
            { albumArtists: [artist('c')], genres: [genre('rock'), genre('pop')] },
            { albumArtists: [artist('b')], genres: [genre('rock')] },
            { albumArtists: [artist('self'), artist('d')], genres: [genre('rock')] },
            { albumArtists: [artist('va', 'Various Artists')], genres: [genre('rock')] },
            { albumArtists: [artist('e')], genres: [genre('metal')] },
            { albumArtists: [artist('server')], genres: [genre('pop')] },
        ],
        'self',
        ['rock', 'pop'],
        ['server'],
    );
    assert.deepEqual(plain(related.map((item) => item.id)), ['c', 'b']);
    assert.deepEqual(plain(rankArtistsBySharedGenres(undefined, 'self', ['rock'])), []);
});

test('primary-genre matches outrank broad-genre matches and collaboration aliases are dropped', () => {
    const related = rankArtistsBySharedGenres(
        [
            { albumArtists: [artist('broad')], genres: [genre('hiphop')] },
            { albumArtists: [artist('broad')], genres: [genre('hiphop')] },
            { albumArtists: [artist('kpop')], genres: [genre('kpop')] },
            { albumArtists: [artist('collab', 'IU & Friends')], genres: [genre('kpop')] },
        ],
        'self',
        ['kpop', 'hiphop'],
        [],
        12,
        'IU',
    );
    assert.deepEqual(plain(related.map((item) => item.id)), ['kpop', 'broad']);
});
