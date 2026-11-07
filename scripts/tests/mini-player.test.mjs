import assert from 'node:assert/strict';
import test from 'node:test';

import {
    expandMiniPlayerQueue,
    resolveMiniPlayerBounds,
} from '../../src/main/utils/mini-player-bounds.ts';

const area = { height: 1040, width: 1920, x: -1920, y: 0 };

test('mini bounds recover a disconnected display and reject malformed sizes', () => {
    assert.deepEqual(resolveMiniPlayerBounds({ width: NaN, x: 4000, y: -500 }, area), {
        height: 320,
        width: 320,
        x: -320,
        y: 0,
    });
    assert.equal(resolveMiniPlayerBounds({ width: 1 }, area).width, 240);
    assert.equal(resolveMiniPlayerBounds({ width: 9999 }, area).width, 600);
});

test('queue expands above the square preserving the bottom anchor and width', () => {
    const square = { height: 320, width: 320, x: -400, y: 600 };
    const expanded = expandMiniPlayerQueue(square, area, true);
    assert.deepEqual(expanded, { height: 560, width: 320, x: -400, y: 360 });
    assert.equal(expanded.y + expanded.height, square.y + square.height);
    assert.deepEqual(expandMiniPlayerQueue(square, area, false), square);
});

test('small work areas and top-edge queue expansion stay on screen', () => {
    const small = { height: 400, width: 240, x: 0, y: 0 };
    const square = resolveMiniPlayerBounds(undefined, small);
    const expanded = expandMiniPlayerQueue(square, small, true);
    assert.equal(expanded.height, 400);
    assert.equal(expanded.y, 0);
    assert.equal(expanded.width, 240);
});
