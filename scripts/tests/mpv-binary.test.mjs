import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const binary = await import('../../src/main/features/core/player/mpv-binary.ts');

test('Windows automatic playback resolves the managed executable with no MPV on PATH', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mpv-resolver-'));
    const executable = join(directory, 'mpv.exe');
    await writeFile(executable, 'existing custom MPV');
    const original = await readFile(executable);
    const result = await binary.resolveMpvBinaryPath({
        arch: 'x64',
        managedDirectory: directory,
        pathValue: '',
        platform: 'win32',
        provision: async () => executable,
    });
    assert.equal(result, executable);
    assert.deepEqual(await readFile(executable), original);
});

test('an explicit Windows executable overrides automatic management and a bad override is actionable', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mpv-override-'));
    const executable = join(directory, 'mpv.exe');
    await writeFile(executable, 'custom');
    const input = {
        arch: 'x64',
        managedDirectory: directory,
        platform: 'win32',
        provision: async () => {
            throw new Error('must not provision with an override');
        },
    };
    assert.equal(
        await binary.resolveMpvBinaryPath({ ...input, storedPath: executable }),
        executable,
    );
    await assert.rejects(
        binary.resolveMpvBinaryPath({ ...input, storedPath: join(directory, 'missing.exe') }),
        /configured MPV.*Settings/i,
    );
});

test('ordinary acquisition errors retain their useful details instead of undefined mpv codes', () => {
    assert.match(binary.getMpvErrorMessage(new Error('MPV download failed: HTTP 404')), /HTTP 404/);
    assert.doesNotMatch(binary.getMpvErrorMessage(new Error('checksum mismatch')), /undefined/);
});

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
