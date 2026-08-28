import assert from 'node:assert/strict';
import test from 'node:test';

const availability = await import('../../src/shared/utils/song-availability.ts');

test('classifies only confirmed missing-song responses as unavailable', () => {
    assert.equal(
        availability.isSongNotFoundResponse('navidrome', 500, {
            data: { error: 'data not found' },
        }),
        true,
    );
    assert.equal(availability.isSongNotFoundResponse('subsonic', 70, {}), true);
    assert.equal(availability.isSongNotFoundResponse('jellyfin', 404, {}), true);

    assert.equal(availability.isSongNotFoundResponse('navidrome', 500, {}), false);
    assert.equal(availability.isSongNotFoundResponse('subsonic', 40, {}), false);
    assert.equal(availability.isSongNotFoundResponse('jellyfin', 500, {}), false);
});

test('typed missing-song errors survive ordinary error boundaries', () => {
    const error = new availability.SongNotFoundError('song-1');

    assert.equal(error.message, 'Song not found: song-1');
    assert.equal(availability.isSongNotFoundError(error), true);
    assert.equal(availability.isSongNotFoundError(new Error('Song not found: song-1')), false);
});

test('stale current-song removal keeps the logical playback slot', () => {
    assert.deepEqual(availability.getUnavailableSongRecovery({ currentIndex: 1, queueLength: 3 }), {
        nextIndex: 1,
        shouldStop: false,
    });
    assert.deepEqual(availability.getUnavailableSongRecovery({ currentIndex: 2, queueLength: 3 }), {
        nextIndex: 1,
        shouldStop: false,
    });
    assert.deepEqual(availability.getUnavailableSongRecovery({ currentIndex: 0, queueLength: 1 }), {
        nextIndex: -1,
        shouldStop: true,
    });
});
