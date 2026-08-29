import assert from 'node:assert/strict';
import test from 'node:test';

const binary = await import('../../src/main/features/core/player/mpv-binary.ts');

test('Windows mpv discovery targets executable files instead of process-detaching wrappers', () => {
    assert.deepEqual(
        binary.getMpvBinaryCandidates({
            pathValue: 'C:\\Program Files\\SVP 4\\mpv64;D:\\Tools\\mpv',
            platform: 'win32',
            requestedPath: 'C:\\Program Files\\SVP 4\\mpv64\\mpv.com',
        }),
        ['C:\\Program Files\\SVP 4\\mpv64\\mpv.exe', 'D:\\Tools\\mpv\\mpv.exe'],
    );
});

test('non-Windows mpv discovery preserves an explicitly configured binary', () => {
    assert.deepEqual(
        binary.getMpvBinaryCandidates({
            pathValue: '/usr/local/bin:/usr/bin',
            platform: 'linux',
            requestedPath: '/opt/mpv/bin/mpv',
        }),
        ['/opt/mpv/bin/mpv'],
    );
});
