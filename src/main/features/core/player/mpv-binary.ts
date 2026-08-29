import { posix, win32 } from 'node:path';

export interface MpvBinaryCandidatesInput {
    pathValue?: string;
    platform: NodeJS.Platform;
    requestedPath?: string;
    storedPath?: string;
}

const normalizeWindowsExecutable = (candidate: string) => {
    const extension = win32.extname(candidate).toLowerCase();

    if (extension === '.com' || extension === '.cmd' || extension === '.bat') {
        return win32.join(win32.dirname(candidate), 'mpv.exe');
    }

    return candidate;
};

export const getMpvBinaryCandidates = (input: MpvBinaryCandidatesInput) => {
    const candidates: string[] = [];
    const configuredPath = input.requestedPath?.trim() || input.storedPath?.trim();

    if (configuredPath) {
        candidates.push(
            input.platform === 'win32'
                ? normalizeWindowsExecutable(configuredPath)
                : configuredPath,
        );
    }

    if (input.platform === 'win32') {
        for (const directory of input.pathValue?.split(';') ?? []) {
            const normalizedDirectory = directory.trim().replace(/^"|"$/g, '');
            if (normalizedDirectory) {
                candidates.push(win32.join(normalizedDirectory, 'mpv.exe'));
            }
        }
    } else if (input.platform === 'darwin' && !configuredPath) {
        candidates.push(posix.join('/opt/homebrew/bin', 'mpv'));
        candidates.push(posix.join('/usr/local/bin', 'mpv'));
    }

    return [...new Set(candidates)];
};
