export type SongLookupSource = 'jellyfin' | 'navidrome' | 'subsonic';

export class SongNotFoundError extends Error {
    readonly code = 'SONG_NOT_FOUND';
    readonly songId: string;

    constructor(songId: string) {
        super(`Song not found: ${songId}`);
        this.name = 'SongNotFoundError';
        this.songId = songId;
    }
}

const responseText = (body: unknown): string => {
    try {
        return JSON.stringify(body).toLocaleLowerCase();
    } catch {
        return String(body).toLocaleLowerCase();
    }
};

export const isSongNotFoundResponse = (
    source: SongLookupSource,
    status: number,
    body: unknown,
): boolean => {
    if (source === 'subsonic') {
        return status === 70;
    }

    if (status === 404) {
        return true;
    }

    const message = responseText(body);
    if (source === 'navidrome') {
        return status === 500 && message.includes('data not found');
    }

    return status === 400 && (message.includes('not found') || message.includes('does not exist'));
};

export const isSongNotFoundError = (error: unknown): error is SongNotFoundError =>
    error instanceof SongNotFoundError ||
    (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'SONG_NOT_FOUND');

export const getUnavailableSongRecovery = ({
    currentIndex,
    queueLength,
}: {
    currentIndex: number;
    queueLength: number;
}): { nextIndex: number; shouldStop: boolean } => {
    const remainingLength = Math.max(0, queueLength - 1);
    if (remainingLength === 0) {
        return { nextIndex: -1, shouldStop: true };
    }

    return {
        nextIndex: Math.min(Math.max(0, currentIndex), remainingLength - 1),
        shouldStop: false,
    };
};
