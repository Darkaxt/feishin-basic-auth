import { strict as assert } from 'node:assert';
import test from 'node:test';

const defaults = await import('../../src/shared/constants/default-player.ts');

test('desktop builds default to MPV/local playback', () => {
    assert.equal(defaults.DEFAULT_DESKTOP_PLAYER_TYPE, 'local');
});
