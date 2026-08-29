import assert from 'node:assert/strict';
import test from 'node:test';

const queueSync = await import('../../src/shared/utils/mpv-queue-sync.ts');

test('queue synchronization requested before initialization is replayed when mpv is ready', async () => {
    const calls = [];
    const coordinator = queueSync.createMpvQueueSyncCoordinator();

    const queued = await coordinator.request(async () => {
        calls.push('restored');
        return true;
    });

    assert.equal(queued, false);
    assert.deepEqual(calls, []);

    const synchronized = await coordinator.markReady(async () => {
        calls.push('latest');
        return true;
    });

    assert.equal(synchronized, true);
    assert.deepEqual(calls, ['restored']);
});

test('the latest pre-initialization queue request wins', async () => {
    const calls = [];
    const coordinator = queueSync.createMpvQueueSyncCoordinator();

    await coordinator.request(async () => {
        calls.push('stale');
        return true;
    });
    await coordinator.request(async () => {
        calls.push('latest');
        return true;
    });
    await coordinator.markReady(async () => {
        calls.push('fallback');
        return true;
    });

    assert.deepEqual(calls, ['latest']);
});

test('a current track is enough to populate mpv without a next track', () => {
    assert.deepEqual(
        queueSync.createMpvQueuePlan({
            currentUrl: 'https://music.test/current',
            isPlaying: true,
            nextUrl: undefined,
            startTime: 42,
        }),
        {
            currentUrl: 'https://music.test/current',
            nextUrl: undefined,
            pause: false,
            startTime: 42,
        },
    );
});

test('mpv queue population is skipped when there is no current track', () => {
    assert.equal(
        queueSync.createMpvQueuePlan({
            currentUrl: undefined,
            isPlaying: false,
            nextUrl: 'https://music.test/next',
        }),
        undefined,
    );
});
