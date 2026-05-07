import type { IncomingMessage, Server, ServerResponse } from 'node:http';

import { ipcMain, net, safeStorage } from 'electron';
import log from 'electron-log/main';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';

import { store } from '/@/main/features/core/settings';
import {
    buildLidaClipsLookupUrl,
    LIDACLIPS_API_KEY_SECRET_KEY,
    LidaClipsClip,
    LidaClipsLookupQuery,
    LidaClipsLookupResult,
    LidaClipsServerProxyAuthSource,
    LidaClipsSettings,
    normalizeLidaClipsBaseUrl,
    rankLidaClips,
    redactLidaClipsSecretsFromText,
    resolveLidaClipsResourceUrl,
    SafeLidaClipsClip,
    selectLidaClipsStreamRequestHeaders,
} from '/@/shared/utils/lidaclips';
import { createBasicAuthorizationHeader } from '/@/shared/utils/proxy-auth';

type LidaClipsLookupRequest = {
    proxyAuth?: LidaClipsServerProxyAuthSource | null;
    query: LidaClipsLookupQuery;
    settings: LidaClipsSettings;
};

type StreamProxyEntry = {
    expiresAt: number;
    headers: Record<string, string>;
    remoteUrl: string;
};

const LEGACY_LIDACLIPS_PROXY_PASSWORD_SECRET_KEY = 'lidaclips:proxy-basic-auth';
const STREAM_TOKEN_TTL_MS = 1000 * 60 * 60;
const streamProxyEntries = new Map<string, StreamProxyEntry>();
let streamProxyPort: null | number = null;
let streamProxyReady: null | Promise<number> = null;
let streamProxyServer: null | Server = null;

const getEncryptedSecrets = (): Record<string, string> => {
    return store.get('server', {}) as Record<string, string>;
};

const getSecret = (key: string): null | string => {
    if (!safeStorage.isEncryptionAvailable()) {
        return null;
    }

    const encrypted = getEncryptedSecrets()[key];

    if (!encrypted) {
        return null;
    }

    try {
        return safeStorage.decryptString(Buffer.from(encrypted, 'hex'));
    } catch {
        return null;
    }
};

const setSecret = (key: string, value: string): boolean => {
    if (!safeStorage.isEncryptionAvailable()) {
        return false;
    }

    const encrypted = safeStorage.encryptString(value);
    const secrets = getEncryptedSecrets();
    secrets[key] = encrypted.toString('hex');
    store.set({ server: secrets });

    return true;
};

const removeSecret = (key: string): void => {
    const secrets = getEncryptedSecrets();
    delete secrets[key];
    store.set({ server: secrets });
};

removeSecret(LEGACY_LIDACLIPS_PROXY_PASSWORD_SECRET_KEY);

const createLookupHeaders = (
    proxyAuth?: LidaClipsServerProxyAuthSource | null,
): null | Record<string, string> => {
    const apiKey = getSecret(LIDACLIPS_API_KEY_SECRET_KEY);

    if (!apiKey) {
        return null;
    }

    const headers: Record<string, string> = {
        'X-Api-Key': apiKey,
    };

    if (proxyAuth?.enabled && proxyAuth.username.trim()) {
        const proxyPassword = getSecret(proxyAuth.secretKey);

        if (proxyPassword) {
            headers.Authorization = createBasicAuthorizationHeader(
                proxyAuth.username.trim(),
                proxyPassword,
            );
        }
    }

    return headers;
};

const getSafeClip = (clip: LidaClipsClip, localStreamUrl: string): SafeLidaClipsClip => ({
    album: clip.album,
    artist: clip.artist,
    created_at: clip.created_at,
    duration: clip.duration,
    file_name: clip.file_name,
    id: clip.id,
    localStreamUrl,
    mime_type: clip.mime_type,
    quality_tier: clip.quality_tier,
    score: clip.score,
    title: clip.title,
    track: clip.track,
    updated_at: clip.updated_at,
});

const pruneExpiredStreamEntries = (): void => {
    const now = Date.now();

    for (const [token, entry] of streamProxyEntries) {
        if (entry.expiresAt <= now) {
            streamProxyEntries.delete(token);
        }
    }
};

const ensureStreamProxyServer = async (): Promise<number> => {
    if (streamProxyPort !== null && streamProxyServer?.listening) {
        return streamProxyPort;
    }

    if (streamProxyReady) {
        return streamProxyReady;
    }

    streamProxyReady = new Promise<number>((resolve, reject) => {
        const server = createServer(handleStreamProxyRequest);
        const rejectStartup = (error: Error) => {
            streamProxyReady = null;
            reject(error);
        };

        server.once('error', rejectStartup);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();

            if (!address || typeof address === 'string') {
                rejectStartup(new Error('Unable to bind LidaClips stream proxy'));
                return;
            }

            streamProxyServer = server;
            streamProxyPort = address.port;
            server.off('error', rejectStartup);
            server.unref();
            resolve(address.port);
        });
    });

    return streamProxyReady;
};

const createStreamProxyUrl = async (
    remoteUrl: string,
    headers: Record<string, string>,
): Promise<string> => {
    pruneExpiredStreamEntries();

    const port = await ensureStreamProxyServer();
    const token = randomBytes(24).toString('base64url');
    streamProxyEntries.set(token, {
        expiresAt: Date.now() + STREAM_TOKEN_TTL_MS,
        headers,
        remoteUrl,
    });

    return `http://127.0.0.1:${port}/lidaclips/stream/${token}`;
};

const sendProxyError = (res: ServerResponse, status: number, message: string): void => {
    res.writeHead(status, {
        'content-type': 'text/plain; charset=utf-8',
    });
    res.end(message);
};

const copyStreamResponseHeaders = (source: Headers, res: ServerResponse): void => {
    for (const header of [
        'accept-ranges',
        'cache-control',
        'content-length',
        'content-range',
        'content-type',
        'etag',
        'last-modified',
    ]) {
        const value = source.get(header);

        if (value) {
            res.setHeader(header, value);
        }
    }
};

async function handleStreamProxyRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const token = requestUrl.pathname.match(/^\/lidaclips\/stream\/([^/]+)$/)?.[1];
        const entry = token ? streamProxyEntries.get(token) : undefined;

        if (!entry || entry.expiresAt <= Date.now()) {
            sendProxyError(res, 404, 'LidaClips stream not found');
            return;
        }

        const requestHeaders = selectLidaClipsStreamRequestHeaders(req.headers);
        const response = await net.fetch(entry.remoteUrl, {
            headers: {
                ...entry.headers,
                ...requestHeaders,
            },
            method: req.method === 'HEAD' ? 'HEAD' : 'GET',
            redirect: 'manual',
        });

        res.statusCode = response.status;
        res.statusMessage = response.statusText;
        copyStreamResponseHeaders(response.headers, res);

        if (req.method === 'HEAD' || !response.body) {
            res.end();
            return;
        }

        Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
    } catch (error) {
        log.warn(
            redactLidaClipsSecretsFromText(
                `LidaClips stream proxy failed: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            ),
        );

        if (!res.headersSent) {
            sendProxyError(res, 502, 'LidaClips stream failed');
            return;
        }

        res.end();
    }
}

const lookupLidaClips = async ({
    proxyAuth,
    query,
    settings,
}: LidaClipsLookupRequest): Promise<LidaClipsLookupResult> => {
    if (!settings.enabled) {
        return { status: 'disabled' };
    }

    const normalizedBaseUrl = normalizeLidaClipsBaseUrl(settings.baseUrl);

    if (!normalizedBaseUrl) {
        return { message: 'LidaClips base URL is not configured', status: 'not-configured' };
    }

    if (!query.artist.trim() || !query.track.trim()) {
        return { status: 'no-match' };
    }

    const headers = createLookupHeaders(proxyAuth);

    if (!headers) {
        return { message: 'LidaClips API key is not configured', status: 'not-configured' };
    }

    try {
        const response = await net.fetch(buildLidaClipsLookupUrl(normalizedBaseUrl, query), {
            headers,
            method: 'GET',
            redirect: 'manual',
        });

        if (response.status === 401 || response.status === 403) {
            return { status: 'unauthorized' };
        }

        if (!response.ok) {
            return {
                message: `LidaClips returned HTTP ${response.status}`,
                status: 'error',
            };
        }

        const payload = (await response.json()) as { clips?: LidaClipsClip[] };
        const clips = Array.isArray(payload.clips) ? payload.clips : [];
        const clip = rankLidaClips(clips);

        if (!clip?.stream_url) {
            return { status: 'no-match' };
        }

        const remoteStreamUrl = resolveLidaClipsResourceUrl(normalizedBaseUrl, clip.stream_url);
        const localStreamUrl = await createStreamProxyUrl(remoteStreamUrl, headers);

        return {
            clip: getSafeClip(clip, localStreamUrl),
            status: 'ok',
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.warn(redactLidaClipsSecretsFromText(`LidaClips lookup failed: ${message}`));

        return {
            message: 'LidaClips lookup failed',
            status: 'error',
        };
    }
};

ipcMain.handle('lidaclips-lookup', (_event, request: LidaClipsLookupRequest) => {
    return lookupLidaClips(request);
});

ipcMain.handle('lidaclips-secret-state', () => {
    return {
        apiKey: Boolean(getSecret(LIDACLIPS_API_KEY_SECRET_KEY)),
    };
});

ipcMain.handle('lidaclips-api-key-set', (_event, apiKey: string) => {
    return setSecret(LIDACLIPS_API_KEY_SECRET_KEY, apiKey);
});

ipcMain.on('lidaclips-api-key-remove', () => {
    removeSecret(LIDACLIPS_API_KEY_SECRET_KEY);
});
