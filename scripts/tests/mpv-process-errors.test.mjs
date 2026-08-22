import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('nonfatal unhandled rejections do not tear down mpv', () => {
    const source = readFileSync(resolve('src/main/features/core/player/index.ts'), 'utf8');
    const handler = source.match(/process\.on\('unhandledRejection',[\s\S]*?\n\}\);/);

    assert.ok(handler, 'missing unhandledRejection handler');
    assert.match(handler[0], /log\.error\('Unhandled rejection:'/);
    assert.doesNotMatch(handler[0], /cleanupMpv/);
});
