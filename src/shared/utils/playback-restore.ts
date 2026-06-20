export function getRestoredPlaybackStartTime(data: {
    currentSongId?: string;
    savedSongId?: string;
    savedTimestamp: number;
}): number | undefined {
    const { currentSongId, savedSongId, savedTimestamp } = data;

    if (!currentSongId || !savedSongId || currentSongId !== savedSongId) {
        return undefined;
    }

    return normalizePlaybackStartTime(savedTimestamp);
}

export function normalizePlaybackStartTime(startTime: number | undefined): number | undefined {
    if (startTime === undefined || !Number.isFinite(startTime) || startTime <= 0) {
        return undefined;
    }

    return startTime;
}
