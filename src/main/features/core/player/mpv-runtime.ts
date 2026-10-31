import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, mkdtemp, open, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';

export interface MpvRuntimeRelease {
    archiveBytes: number;
    archiveSha256: string;
    files: Record<string, string>;
    id: string;
    machine: number;
    url: string;
}

// Pinned upstream distributions, linked by https://mpv.io/installation/.
// Archive and extracted-file hashes are verified before any binary is used.
export const MPV_RUNTIME_RELEASES: Record<string, MpvRuntimeRelease> = {
    arm64: {
        archiveBytes: 27192541,
        archiveSha256: 'aa3974b4c7dea2a05eea1198cce0318f195f01c599df203f76431cb4ca5994cc',
        files: { 'mpv.exe': '3a71879c0c7151e9df4c56f25396796c5195aed53085f76bec796c7f12071fda' },
        id: '20261021-e471496c56-arm64',
        machine: 0xaa64,
        url: 'https://github.com/shinchiro/mpv-winbuild-cmake/releases/download/20261021/mpv-aarch64-20261021-git-e471496c56.7z',
    },
    x64: {
        archiveBytes: 34025957,
        archiveSha256: '4a355f3e89c83fabc730d33fb4e759dfec747806ed2287b61a90d1681b83e8d3',
        files: {
            'd3dcompiler_43.dll':
                '4b074a3976399dc735484f5d43d04b519b7bdee8ac719d9ab8ed6bd4e6be0345',
            'mpv.exe': '8c2e4d24eb961723cc5e2f1f4401982836e82c96e0e0a944c0576090fc48993f',
        },
        id: '20261021-e471496c56-x64',
        machine: 0x8664,
        url: 'https://github.com/shinchiro/mpv-winbuild-cmake/releases/download/20261021/mpv-x86_64-20261021-git-e471496c56.7z',
    },
};

const acquisitions = new Map<string, Promise<string>>();
const execute = promisify(execFile);

const sha256 = async (file: string) => {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    return hash.digest('hex');
};

const verifyRuntime = async (directory: string, release: MpvRuntimeRelease) => {
    for (const [name, expected] of Object.entries(release.files)) {
        if ((await sha256(join(directory, name))) !== expected) {
            throw new Error(
                'Managed MPV verification failed. Remove this runtime and restart, or select a custom executable in Settings > Playback.',
            );
        }
    }
    const file = await open(join(directory, 'mpv.exe'), 'r');
    try {
        const dos = Buffer.alloc(64);
        await file.read(dos, 0, dos.length, 0);
        const pe = Buffer.alloc(6);
        await file.read(pe, 0, pe.length, dos.readUInt32LE(60));
        if (
            dos.readUInt16LE(0) !== 0x5a4d ||
            pe.readUInt32LE(0) !== 0x4550 ||
            pe.readUInt16LE(4) !== release.machine
        ) {
            throw new Error('Downloaded MPV executable does not match this Windows architecture.');
        }
    } finally {
        await file.close();
    }
};

const acquire = async (directory: string, release: MpvRuntimeRelease, onDownload?: () => void) => {
    const destination = join(directory, release.id);
    let cached = true;
    try {
        await access(destination);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        cached = false;
    }
    if (cached) {
        await verifyRuntime(destination, release);
        return join(destination, 'mpv.exe');
    }

    await mkdir(directory, { recursive: true });
    const staging = await mkdtemp(join(directory, '.install-'));
    const archive = join(staging, 'download.7z');
    try {
        onDownload?.();
        const response = await fetch(release.url);
        if (!response.ok || !response.body) {
            throw new Error(
                `MPV download failed (HTTP ${response.status}). Check the connection and restart, or select a custom executable in Settings > Playback.`,
            );
        }
        let bytes = 0;
        const hash = createHash('sha256');
        const body = async function* () {
            for await (const chunk of Readable.fromWeb(
                response.body! as import('node:stream/web').ReadableStream,
            )) {
                bytes += chunk.length;
                if (bytes > release.archiveBytes)
                    throw new Error('MPV download exceeded its pinned size.');
                hash.update(chunk);
                yield chunk;
            }
        };
        await pipeline(body(), createWriteStream(archive, { flags: 'wx' }));
        if (bytes !== release.archiveBytes || hash.digest('hex') !== release.archiveSha256) {
            throw new Error(
                'MPV download checksum verification failed. No executable was installed.',
            );
        }

        // Windows ships libarchive's tar. Only the verified runtime files are extracted;
        // upstream register/updater scripts and user configuration are never installed or run.
        const tar =
            process.platform === 'win32'
                ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
                : 'tar';
        await execute(tar, ['-xf', archive, '-C', staging, ...Object.keys(release.files)], {
            windowsHide: true,
        });
        await verifyRuntime(staging, release);
        await rm(archive);
        await writeFile(
            join(staging, 'provenance.json'),
            JSON.stringify(
                {
                    archiveSha256: release.archiveSha256,
                    distribution: release.url,
                    mpvSource: 'https://github.com/mpv-player/mpv/tree/e471496c56',
                    source: 'https://github.com/shinchiro/mpv-winbuild-cmake/tree/1f8d2e7',
                },
                null,
                2,
            ),
        );
        await rename(staging, destination);
        return join(destination, 'mpv.exe');
    } finally {
        await rm(staging, { force: true, recursive: true });
    }
};

export const ensureManagedMpv = (
    directory: string,
    arch: string,
    onDownload?: () => void,
    release = MPV_RUNTIME_RELEASES[arch],
) => {
    if (!release)
        return Promise.reject(
            new Error(
                `Automatic MPV download is unavailable for Windows ${arch}. Select a custom executable in Settings > Playback.`,
            ),
        );
    const key = join(directory, release.id);
    let pending = acquisitions.get(key);
    if (!pending) {
        pending = acquire(directory, release, onDownload)
            .catch((error: unknown) => {
                const detail = error instanceof Error ? error.message : String(error);
                throw new Error(
                    `Automatic MPV setup failed: ${detail} Check the connection and restart Feishin, or select a custom executable in Settings > Playback.`,
                    { cause: error },
                );
            })
            .finally(() => acquisitions.delete(key));
        acquisitions.set(key, pending);
    }
    return pending;
};
