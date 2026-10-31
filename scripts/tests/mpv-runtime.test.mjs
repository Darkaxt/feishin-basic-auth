import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ensureManagedMpv } from '../../src/main/features/core/player/mpv-runtime.ts';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- JavaScript fixture helper.
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

// A real tar archive containing a minimal PE header, sufficient for integrity/architecture
// tests. Production acquisition still extracts with the native platform tar executable.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- JavaScript fixture helper.
function fixture(machine = 0x8664) {
    const executable = Buffer.alloc(128);
    executable.writeUInt16LE(0x5a4d, 0);
    executable.writeUInt32LE(64, 60);
    executable.writeUInt32LE(0x4550, 64);
    executable.writeUInt16LE(machine, 68);
    const header = Buffer.alloc(512);
    header.write('mpv.exe');
    header.write('0000755\0', 100);
    header.write('0000000\0', 108);
    header.write('0000000\0', 116);
    header.write('00000000200\0', 124);
    header.write('00000000000\0', 136);
    header.fill(32, 148, 156);
    header.write('0', 156);
    header.write('ustar\0', 257);
    header.write('00', 263);
    header.write(
        [...header]
            .reduce((sum, byte) => sum + byte, 0)
            .toString(8)
            .padStart(6, '0') + '\0 ',
        148,
    );
    const archive = Buffer.concat([
        header,
        executable,
        Buffer.alloc(512 - executable.length + 1024),
    ]);
    return {
        archive,
        executable,
        release: {
            archiveBytes: archive.length,
            archiveSha256: digest(archive),
            files: { 'mpv.exe': digest(executable) },
            id: 'fixture-x64',
            machine: 0x8664,
            url: 'https://github.com/fixture/fixture/releases/download/pin/runtime.7z',
        },
    };
}

test('cold acquisition publishes verified MPV once for concurrent consumers, then reuses it offline', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'mpv-provision-'));
    const { archive, executable, release } = fixture();
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async () => {
        requests += 1;
        return new Response(archive);
    });
    const [first, second] = await Promise.all([
        ensureManagedMpv(directory, 'x64', undefined, release),
        ensureManagedMpv(directory, 'x64', undefined, release),
    ]);
    assert.equal(first, join(directory, 'fixture-x64', 'mpv.exe'));
    assert.equal(first, second);
    assert.deepEqual(await readFile(first), executable);
    assert.equal(requests, 1);
    assert.deepEqual(await readdir(directory), ['fixture-x64']);
    t.mock.method(globalThis, 'fetch', async () => {
        throw new Error('offline');
    });
    assert.equal(await ensureManagedMpv(directory, 'x64', undefined, release), first);
});

test('a corrupt archive never publishes an executable and leaves no partial installation', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'mpv-corrupt-'));
    const { archive, release } = fixture();
    const corrupted = Buffer.from(archive);
    corrupted[520] ^= 1;
    t.mock.method(globalThis, 'fetch', async () => new Response(corrupted));
    await assert.rejects(
        ensureManagedMpv(directory, 'x64', undefined, release),
        /checksum verification failed/,
    );
    assert.deepEqual(await readdir(directory), []);
});

test('download interruption is cleaned and a later explicit request can acquire successfully', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'mpv-interrupted-'));
    const { archive, release } = fixture();
    t.mock.method(
        globalThis,
        'fetch',
        async () =>
            new Response(
                new ReadableStream({
                    start(controller) {
                        controller.error(new Error('connection interrupted'));
                    },
                }),
            ),
    );
    await assert.rejects(
        ensureManagedMpv(directory, 'x64', undefined, release),
        /connection interrupted/,
    );
    assert.deepEqual(await readdir(directory), []);
    t.mock.method(globalThis, 'fetch', async () => new Response(archive));
    assert.equal(
        await ensureManagedMpv(directory, 'x64', undefined, release),
        join(directory, release.id, 'mpv.exe'),
    );
});

test('a correctly hashed executable for the wrong architecture is rejected before publication', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'mpv-wrong-architecture-'));
    const { archive, release } = fixture(0xaa64);
    t.mock.method(globalThis, 'fetch', async () => new Response(archive));
    await assert.rejects(
        ensureManagedMpv(directory, 'x64', undefined, release),
        /does not match this Windows architecture/,
    );
    assert.deepEqual(await readdir(directory), []);
});

test('tampered cached MPV is never executed or silently trusted', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'mpv-tampered-'));
    const { archive, release } = fixture();
    t.mock.method(globalThis, 'fetch', async () => new Response(archive));
    const executable = await ensureManagedMpv(directory, 'x64', undefined, release);
    await writeFile(executable, 'tampered');
    await assert.rejects(
        ensureManagedMpv(directory, 'x64', undefined, release),
        /Managed MPV verification failed/,
    );
    assert.equal(await readFile(executable, 'utf8'), 'tampered');
});
