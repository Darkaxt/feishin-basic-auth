import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldShowFullscreenImagePlaceholder } from '../../src/shared/utils/fullscreen-player-image.ts';

test('fullscreen artwork falls back only when its source is absent or failed', () => {
    assert.equal(shouldShowFullscreenImagePlaceholder(undefined, null), true);
    assert.equal(shouldShowFullscreenImagePlaceholder('', null), true);
    assert.equal(shouldShowFullscreenImagePlaceholder('cover-a', 'cover-a'), true);
    assert.equal(shouldShowFullscreenImagePlaceholder('cover-b', 'cover-a'), false);
});
