import { stat } from 'node:fs/promises';
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

export const resolveMpvBinaryPath = async (
    input: MpvBinaryCandidatesInput & { provision: () => Promise<string> },
) => {
    const configuredPath = input.requestedPath?.trim() || input.storedPath?.trim();
    if (input.platform === 'win32' && !configuredPath) {
        return input.provision();
    }

    for (const candidate of getMpvBinaryCandidates(input)) {
        try {
            if ((await stat(candidate)).isFile()) {
                return candidate;
            }
        } catch {
            // Continue discovery on non-Windows platforms.
        }
        if (input.platform === 'win32' && configuredPath) {
            throw new Error(
                'The configured MPV executable is missing. Select it or clear the override in Settings > Playback.',
            );
        }
    }
    return undefined;
};

export const getMpvErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (
        error &&
        typeof error === 'object' &&
        'errcode' in error &&
        typeof error.errcode === 'number'
    ) {
        const descriptions: Record<number, string> = {
            0: 'Unable to load file or stream',
            1: 'Invalid argument',
            2: 'Binary not found',
            3: 'IPC command invalid',
            4: 'Unable to bind IPC socket',
            5: 'Connection timeout',
            6: 'MPV is already running',
            7: 'Could not send IPC message',
            8: 'MPV is not running',
            9: 'Unsupported protocol',
        };
        return `MPV error ${error.errcode}: ${descriptions[error.errcode] || 'Unknown MPV error code'}`;
    }
    return 'Unknown MPV failure';
};
