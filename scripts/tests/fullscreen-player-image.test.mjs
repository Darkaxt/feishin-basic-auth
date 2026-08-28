import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getFullscreenArtworkSlots,
    shouldShowFullscreenImagePlaceholder,
} from '../../src/shared/utils/fullscreen-player-image.ts';

test('fullscreen artwork falls back only when its source is absent or failed', () => {
    assert.equal(shouldShowFullscreenImagePlaceholder(undefined, null), true);
    assert.equal(shouldShowFullscreenImagePlaceholder('', null), true);
    assert.equal(shouldShowFullscreenImagePlaceholder('cover-a', 'cover-a'), true);
    assert.equal(shouldShowFullscreenImagePlaceholder('cover-b', 'cover-a'), false);
});

test('fullscreen artwork keeps the inactive next-cover slot mounted for preloading', () => {
    assert.deepEqual(getFullscreenArtworkSlots(0, 'cover-a', 'cover-b'), [
        { active: true, id: 'top', render: true, src: 'cover-a' },
        { active: false, id: 'bottom', render: true, src: 'cover-b' },
    ]);
    assert.deepEqual(getFullscreenArtworkSlots(1, 'cover-c', 'cover-b'), [
        { active: false, id: 'top', render: true, src: 'cover-c' },
        { active: true, id: 'bottom', render: true, src: 'cover-b' },
    ]);
});

test('fullscreen artwork always renders the active placeholder but skips an empty inactive slot', () => {
    assert.deepEqual(getFullscreenArtworkSlots(0, undefined, undefined), [
        { active: true, id: 'top', render: true, src: undefined },
        { active: false, id: 'bottom', render: false, src: undefined },
    ]);
});
