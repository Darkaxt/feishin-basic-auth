import assert from 'node:assert/strict';
import test from 'node:test';

const vinyl = await import('../../src/shared/utils/vinyl-artwork.ts');

test('vinyl policy matches the Navic timing and geometry contract', () => {
    assert.equal(vinyl.VINYL_ROTATION_DURATION_MS, 8000);
    assert.equal(vinyl.VINYL_GROOVE_COUNT, 48);
    assert.ok(vinyl.VINYL_SPINDLE_RADIUS < vinyl.VINYL_LABEL_RADIUS);
    assert.ok(vinyl.VINYL_LABEL_RADIUS < vinyl.VINYL_GROOVE_START_RADIUS);
    assert.ok(vinyl.VINYL_GROOVE_START_RADIUS < vinyl.VINYL_GROOVE_END_RADIUS);
});

test('rotation requires active exact artwork and resets every cycle', () => {
    const active = {
        artworkReady: true,
        enabled: true,
        isActiveSong: true,
        isPlaying: true,
        reducedMotion: false,
        shrinkOnPause: true,
    };

    assert.deepEqual(vinyl.getVinylPresentation(active), {
        rotate: true,
        showRecord: true,
        shrink: false,
    });
    assert.equal(vinyl.getVinylRotationAngle(0), 0);
    assert.equal(vinyl.getVinylRotationAngle(2000), 90);
    assert.equal(vinyl.getVinylRotationAngle(4000), 180);
    assert.equal(vinyl.getVinylRotationAngle(8000), 0);

    for (const override of [
        { artworkReady: false },
        { enabled: false },
        { isActiveSong: false },
        { isPlaying: false },
        { reducedMotion: true },
    ]) {
        assert.equal(vinyl.getVinylPresentation({ ...active, ...override }).rotate, false);
    }
});

test('pause restores the normal cover and optionally shrinks it', () => {
    assert.deepEqual(
        vinyl.getVinylPresentation({
            artworkReady: true,
            enabled: true,
            isActiveSong: true,
            isPlaying: false,
            reducedMotion: false,
            shrinkOnPause: true,
        }),
        { rotate: false, showRecord: false, shrink: true },
    );

    assert.deepEqual(
        vinyl.getVinylPresentation({
            artworkReady: false,
            enabled: true,
            isActiveSong: true,
            isPlaying: true,
            reducedMotion: false,
            shrinkOnPause: true,
        }),
        { rotate: false, showRecord: false, shrink: false },
    );
});

test('wide-cover classification is deterministic', () => {
    assert.equal(vinyl.isWideVinylArtwork(1179, 1000), false);
    assert.equal(vinyl.isWideVinylArtwork(1180, 1000), true);
});

test('artwork readiness is tied to the exact request identity', () => {
    assert.equal(vinyl.isExactVinylArtworkReady('song-a|cover-a', 'song-a|cover-a', null), true);
    assert.equal(vinyl.isExactVinylArtworkReady('song-b|cover-b', 'song-a|cover-a', null), false);
    assert.equal(
        vinyl.isExactVinylArtworkReady('song-a|cover-a', 'song-a|cover-a', 'song-a|cover-a'),
        false,
    );
});
