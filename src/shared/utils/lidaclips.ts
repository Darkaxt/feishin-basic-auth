export const LIDACLIPS_API_KEY_SECRET_KEY = 'lidaclips:api-key';

export const LIDA_CLIPS_DISPLAY_MODE = {
    AMBIENT_BACKGROUND: 'ambientBackground',
    PLAYER: 'player',
} as const;

export type LidaClipsDisplayMode =
    (typeof LIDA_CLIPS_DISPLAY_MODE)[keyof typeof LIDA_CLIPS_DISPLAY_MODE];

export const LIDA_CLIPS_AMBIENT_SYNC_MODE = {
    FIT_SONG: 'fitSong',
    NATURAL: 'natural',
} as const;

export type LidaClipsAmbientSyncMode =
    (typeof LIDA_CLIPS_AMBIENT_SYNC_MODE)[keyof typeof LIDA_CLIPS_AMBIENT_SYNC_MODE];

export type LidaClipsClip = {
    album?: null | string;
    artist?: null | string;
    created_at?: null | string;
    duration?: null | number;
    evidence?: unknown;
    file_name?: null | string;
    id: number | string;
    localStreamUrl?: string;
    mime_type?: null | string;
    quality_tier?: null | string;
    score?: null | number;
    source_url?: null | string;
    stream_url?: null | string;
    title?: null | string;
    track?: null | string;
    updated_at?: null | string;
};

export type LidaClipsLookupQuery = {
    album?: null | string;
    artist: string;
    track: string;
};

export type LidaClipsLookupResult =
    | {
          clip: SafeLidaClipsClip;
          status: 'ok';
      }
    | {
          message?: string;
          status: 'disabled' | 'error' | 'no-match' | 'not-configured' | 'unauthorized';
      };

export type LidaClipsPlaybackAction = 'none' | 'pauseAudio' | 'playAudio';

export type LidaClipsPlaybackDecision = {
    clipModeActive: boolean;
    playerAction: LidaClipsPlaybackAction;
    shouldAutoplayClip: boolean;
    tab: 'clips' | 'queue' | 'visualizer';
};

export type LidaClipsSecretState = {
    apiKey: boolean;
};

export type LidaClipsServerProxyAuthSource = {
    enabled: true;
    secretKey: string;
    username: string;
};

export type LidaClipsSettings = {
    ambientSyncMode: LidaClipsAmbientSyncMode;
    baseUrl: string;
    displayMode: LidaClipsDisplayMode;
    enabled: boolean;
};

export type LidaClipsSongLike = {
    album?: null | string;
    artistName?: null | string;
    name?: null | string;
};

export type SafeLidaClipsClip = Pick<
    LidaClipsClip,
    | 'album'
    | 'artist'
    | 'created_at'
    | 'duration'
    | 'file_name'
    | 'id'
    | 'mime_type'
    | 'quality_tier'
    | 'score'
    | 'title'
    | 'track'
    | 'updated_at'
> & {
    localStreamUrl: string;
};

type ServerProxyAuthLike = {
    id: string;
    proxyAuth?: {
        enabled: boolean;
        username: string;
    };
};

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const SERVER_PROXY_BASIC_AUTH_SECRET_PREFIX = 'proxy-basic-auth';
const AMBIENT_MIN_PLAYBACK_RATE = 0.75;
const AMBIENT_MAX_PLAYBACK_RATE = 1.5;
const STREAM_FORWARD_HEADERS = new Set([
    'if-match',
    'if-modified-since',
    'if-none-match',
    'if-range',
    'if-unmodified-since',
    'range',
]);

const toTimestamp = (value?: null | string) => {
    if (!value) return 0;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : 0;
};

const toScore = (value?: null | number) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 0;
    }

    return value;
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const normalizeLidaClipsBaseUrl = (baseUrl: string): null | string => {
    const trimmed = baseUrl.trim();

    if (!trimmed) {
        return null;
    }

    try {
        const parsed = new URL(trimmed);

        if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
            return null;
        }

        parsed.username = '';
        parsed.password = '';
        parsed.hash = '';
        parsed.search = '';

        return stripTrailingSlash(parsed.toString());
    } catch {
        return null;
    }
};

export const buildLidaClipsLookupUrl = (baseUrl: string, query: LidaClipsLookupQuery): string => {
    const normalizedBaseUrl = normalizeLidaClipsBaseUrl(baseUrl);

    if (!normalizedBaseUrl) {
        throw new Error('Invalid LidaClips base URL');
    }

    const url = new URL('api/v1/clips', `${normalizedBaseUrl}/`);
    url.searchParams.set('artist', query.artist);
    url.searchParams.set('album', query.album ?? '');
    url.searchParams.set('track', query.track);

    return url.toString();
};

export const resolveLidaClipsResourceUrl = (baseUrl: string, resourceUrl: string): string => {
    const normalizedBaseUrl = normalizeLidaClipsBaseUrl(baseUrl);

    if (!normalizedBaseUrl) {
        throw new Error('Invalid LidaClips base URL');
    }

    const parsedBaseUrl = new URL(normalizedBaseUrl);

    if (/^https?:\/\//i.test(resourceUrl)) {
        const parsedResourceUrl = new URL(resourceUrl);

        if (!HTTP_PROTOCOLS.has(parsedResourceUrl.protocol)) {
            throw new Error('Invalid LidaClips resource URL');
        }

        if (parsedResourceUrl.origin !== parsedBaseUrl.origin) {
            throw new Error('LidaClips resource URL must use the configured origin');
        }

        parsedResourceUrl.username = '';
        parsedResourceUrl.password = '';

        return parsedResourceUrl.toString();
    }

    const resourcePath = resourceUrl.replace(/^\/+/, '');
    const normalizedBasePath = parsedBaseUrl.pathname.replace(/^\/+|\/+$/g, '');

    if (normalizedBasePath && resourcePath.startsWith(`${normalizedBasePath}/`)) {
        return new URL(resourcePath, `${parsedBaseUrl.origin}/`).toString();
    }

    return new URL(resourcePath, `${normalizedBaseUrl}/`).toString();
};

export const createLidaClipsLookupQueryFromSong = (
    song?: LidaClipsSongLike | null,
): LidaClipsLookupQuery | null => {
    const artist = song?.artistName?.trim();
    const track = song?.name?.trim();

    if (!artist || !track) {
        return null;
    }

    return {
        album: song?.album ?? '',
        artist,
        track,
    };
};

export const createLidaClipsProxyAuthSourceFromServer = (
    server?: null | ServerProxyAuthLike,
): LidaClipsServerProxyAuthSource | undefined => {
    const username = server?.proxyAuth?.username.trim();

    if (!server?.id || !server.proxyAuth?.enabled || !username) {
        return undefined;
    }

    return {
        enabled: true,
        secretKey: `${SERVER_PROXY_BASIC_AUTH_SECRET_PREFIX}:${server.id}`,
        username,
    };
};

export const rankLidaClips = <T extends LidaClipsClip>(clips: T[]): null | T => {
    if (clips.length === 0) {
        return null;
    }

    return [...clips].sort((a, b) => {
        const officialScore =
            (b.quality_tier === 'official' ? 1 : 0) - (a.quality_tier === 'official' ? 1 : 0);
        if (officialScore !== 0) return officialScore;

        const score = toScore(b.score) - toScore(a.score);
        if (score !== 0) return score;

        return toTimestamp(b.updated_at) - toTimestamp(a.updated_at);
    })[0];
};

export const redactLidaClipsSecretsFromText = (value: string): string => {
    return value
        .replace(/\bBasic\s+[A-Za-z0-9+/=]+/g, 'Basic <redacted>')
        .replace(/(https?:\/\/)([^:@/\s]+):([^@/\s]+)@/gi, '$1<proxy-auth>@')
        .replace(/\b(X-Api-Key\s*:\s*)[^\s&]+/gi, '$1<redacted>')
        .replace(/([?&](?:apiKey|api_key)=)[^&\s]+/gi, '$1<redacted>');
};

export const selectLidaClipsStreamRequestHeaders = (
    requestHeaders: Record<string, string | string[] | undefined>,
): Record<string, string> => {
    const forwardedHeaders: Record<string, string> = {};

    for (const [name, value] of Object.entries(requestHeaders)) {
        const normalizedName = name.toLowerCase();

        if (!STREAM_FORWARD_HEADERS.has(normalizedName) || value === undefined) {
            continue;
        }

        forwardedHeaders[normalizedName] = Array.isArray(value) ? value.join(', ') : value;
    }

    return forwardedHeaders;
};

export const shouldShowLidaClipsTab = (
    settings: Partial<Pick<LidaClipsSettings, 'displayMode'>> &
        Pick<LidaClipsSettings, 'enabled'> & {
            lookupStatus?: LidaClipsLookupResult['status'];
        },
): boolean => {
    return settings.enabled && settings.lookupStatus === 'ok';
};

export const sanitizeLidaClipsRuntimeState = <
    T extends {
        clipModeActive?: unknown;
        clipModeTransferRatio?: unknown;
        clipModeTransferSongUniqueId?: unknown;
    },
>(
    state: T,
): T & {
    clipModeActive: false;
    clipModeTransferRatio: null;
    clipModeTransferSongUniqueId: null;
} => {
    return {
        ...state,
        clipModeActive: false,
        clipModeTransferRatio: null,
        clipModeTransferSongUniqueId: null,
    };
};

export const shouldUseLidaClipsAmbientBackground = ({
    dynamicBackground,
    enabled,
    mode,
    status,
}: {
    dynamicBackground: boolean;
    enabled: boolean;
    mode: LidaClipsDisplayMode;
    status?: LidaClipsLookupResult['status'];
}): boolean => {
    return (
        enabled &&
        dynamicBackground &&
        mode === LIDA_CLIPS_DISPLAY_MODE.AMBIENT_BACKGROUND &&
        status === 'ok'
    );
};

const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

export const mapLidaClipsProgress = ({
    sourceCurrentTime,
    sourceDuration,
    targetDuration,
}: {
    sourceCurrentTime: number;
    sourceDuration: number;
    targetDuration: number;
}): number => {
    if (sourceDuration <= 0 || targetDuration <= 0) {
        return 0;
    }

    const progress = clamp(sourceCurrentTime / sourceDuration, 0, 1);
    return progress * targetDuration;
};

export const getLidaClipsAmbientPlaybackRate = ({
    clipDuration,
    mode,
    songDuration,
}: {
    clipDuration?: null | number;
    mode: LidaClipsAmbientSyncMode;
    songDuration?: null | number;
}): number => {
    if (
        mode !== LIDA_CLIPS_AMBIENT_SYNC_MODE.FIT_SONG ||
        !clipDuration ||
        !songDuration ||
        clipDuration <= 0 ||
        songDuration <= 0
    ) {
        return 1;
    }

    return clamp(clipDuration / songDuration, AMBIENT_MIN_PLAYBACK_RATE, AMBIENT_MAX_PLAYBACK_RATE);
};

export const getLidaClipsFallbackTab = ({
    webAudio,
}: {
    webAudio: boolean;
}): 'queue' | 'visualizer' => {
    return webAudio ? 'visualizer' : 'queue';
};

export const getLidaClipsPlaybackDecision = ({
    clipModeActive,
    lookupStatus,
    webAudio,
}: {
    clipModeActive: boolean;
    lookupStatus: LidaClipsLookupResult['status'];
    webAudio: boolean;
}): LidaClipsPlaybackDecision => {
    if (!clipModeActive) {
        return {
            clipModeActive: false,
            playerAction: 'none',
            shouldAutoplayClip: false,
            tab: 'clips',
        };
    }

    if (lookupStatus === 'ok') {
        return {
            clipModeActive: true,
            playerAction: 'pauseAudio',
            shouldAutoplayClip: true,
            tab: 'clips',
        };
    }

    return {
        clipModeActive: true,
        playerAction: 'playAudio',
        shouldAutoplayClip: false,
        tab: getLidaClipsFallbackTab({ webAudio }),
    };
};

export const shouldExitLidaClipsModeForTab = (tab: string): boolean => {
    return tab !== 'clips' && tab !== 'visualizer';
};

export const shouldPauseAfterAutoNext = ({
    keepPaused,
    pauseOnNext,
    shouldPause,
}: {
    keepPaused?: boolean;
    pauseOnNext: boolean;
    shouldPause: boolean;
}): boolean => {
    return Boolean(keepPaused || pauseOnNext || shouldPause);
};

export const shouldStopLidaClipsModeAfterAutoNext = ({
    hasNextSong,
    pauseOnNext,
}: {
    hasNextSong: boolean;
    pauseOnNext: boolean;
}): boolean => {
    return pauseOnNext || !hasNextSong;
};
