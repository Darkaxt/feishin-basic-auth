import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const sourcePath = resolve(
    process.cwd(),
    'src/renderer/features/context-menu/menus/genre-context-menu.tsx',
);

test('genre context menu queues and playlist-adds genre songs, not albums', () => {
    const source = readFileSync(sourcePath, 'utf8');

    assert.match(source, /<PlayAction\s+ids=\{ids\}\s+itemType=\{LibraryItem\.GENRE\}\s*\/>/u);
    assert.match(
        source,
        /<AddToPlaylistAction\s+items=\{ids\}\s+itemType=\{LibraryItem\.GENRE\}\s*\/>/u,
    );
    assert.doesNotMatch(
        source,
        /<(?:PlayAction|AddToPlaylistAction)\s+[^>]*itemType=\{LibraryItem\.ALBUM\}/u,
    );
});
