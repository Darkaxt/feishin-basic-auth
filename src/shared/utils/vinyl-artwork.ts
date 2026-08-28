export const VINYL_ROTATION_DURATION_MS = 8000;
export const VINYL_REVEAL_DURATION_MS = 180;
export const VINYL_SPINDLE_RADIUS = 0.025;
export const VINYL_LABEL_RADIUS = 0.17;
export const VINYL_GROOVE_START_RADIUS = 0.24;
export const VINYL_GROOVE_END_RADIUS = 0.95;
export const VINYL_GROOVE_COUNT = 48;
export const VINYL_WIDE_ARTWORK_RATIO = 1.18;

export type VinylPresentationInput = {
    artworkReady: boolean;
    enabled: boolean;
    isActiveSong: boolean;
    isPlaying: boolean;
    reducedMotion: boolean;
    shrinkOnPause: boolean;
};

export const getVinylPresentation = ({
    artworkReady,
    enabled,
    isActiveSong,
    isPlaying,
    reducedMotion,
    shrinkOnPause,
}: VinylPresentationInput) => {
    const showRecord = enabled && artworkReady;
    const active = showRecord && isActiveSong && isPlaying;

    return {
        rotate: active && !reducedMotion,
        showRecord,
        shrink: showRecord && shrinkOnPause && !active && !reducedMotion,
    };
};

export const getVinylRotationAngle = (elapsedMs: number): number => {
    const normalized = Math.max(0, elapsedMs) % VINYL_ROTATION_DURATION_MS;
    return (normalized / VINYL_ROTATION_DURATION_MS) * 360;
};

export const isWideVinylArtwork = (width: number, height: number): boolean =>
    height > 0 && width / height >= VINYL_WIDE_ARTWORK_RATIO;

export const isExactVinylArtworkReady = (
    requestKey: string,
    resolvedRequestKey: null | string,
    failedRequestKey: null | string,
): boolean => resolvedRequestKey === requestKey && failedRequestKey !== requestKey;
