import assert from 'node:assert/strict';
import test from 'node:test';

const restore = await import('../../src/shared/utils/playback-restore.ts');

test('getRestoredPlaybackStartTime resumes the matching current song', () => {
    assert.equal(
        restore.getRestoredPlaybackStartTime({
            currentSongId: 'song-1',
            savedSongId: 'song-1',
            savedTimestamp: 96,
        }),
        96,
    );
});

test('getRestoredPlaybackStartTime ignores stale or empty resume positions', () => {
    assert.equal(
        restore.getRestoredPlaybackStartTime({
            currentSongId: 'song-2',
            savedSongId: 'song-1',
            savedTimestamp: 96,
        }),
        undefined,
    );
    assert.equal(
        restore.getRestoredPlaybackStartTime({
            currentSongId: 'song-1',
            savedSongId: 'song-1',
            savedTimestamp: 0,
        }),
        undefined,
    );
});

test('normalizePlaybackStartTime rejects invalid start positions', () => {
    assert.equal(restore.normalizePlaybackStartTime(42), 42);
    assert.equal(restore.normalizePlaybackStartTime(undefined), undefined);
    assert.equal(restore.normalizePlaybackStartTime(Number.NaN), undefined);
    assert.equal(restore.normalizePlaybackStartTime(-1), undefined);
});
