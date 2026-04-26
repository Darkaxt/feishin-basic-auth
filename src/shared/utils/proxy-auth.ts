export const PROXY_BASIC_AUTH_SECRET_PREFIX = 'proxy-basic-auth';

export type ProxyAuthServer = {
    id: string;
    proxyAuth?: ProxyBasicAuthConfig;
    remoteUrl?: string;
    url?: string;
};

export type ProxyBasicAuthConfig = {
    enabled: boolean;
    type: 'basic';
    username: string;
};

export type SanitizedServerUrl = {
    proxyPassword?: string;
    proxyUsername?: string;
    url: string;
};

type GlobalWithEncoding = typeof globalThis & {
    btoa?: (input: string) => string;
    Buffer?: {
        from: (input: string, encoding: 'utf8') => { toString: (encoding: 'base64') => string };
    };
};

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

const toUrl = (rawUrl?: string): null | URL => {
    const trimmed = rawUrl?.trim();

    if (!trimmed) {
        return null;
    }

    try {
        const parsed = new URL(trimmed);

        if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
};

export const getProxyBasicAuthSecretKey = (serverId: string) => {
    return `${PROXY_BASIC_AUTH_SECRET_PREFIX}:${serverId}`;
};

export const sanitizeServerUrl = (rawUrl: string): SanitizedServerUrl => {
    const parsed = toUrl(rawUrl);

    if (!parsed) {
        return { url: stripTrailingSlash(rawUrl.trim()) };
    }

    const proxyUsername = parsed.username ? decodeURIComponent(parsed.username) : undefined;
    const proxyPassword = parsed.password ? decodeURIComponent(parsed.password) : undefined;

    parsed.username = '';
    parsed.password = '';

    return {
        ...(proxyPassword && { proxyPassword }),
        ...(proxyUsername && { proxyUsername }),
        url: stripTrailingSlash(parsed.toString()),
    };
};

export const normalizeUrlToOrigin = (rawUrl?: string): null | string => {
    const parsed = toUrl(rawUrl);

    if (!parsed) {
        return null;
    }

    parsed.username = '';
    parsed.password = '';

    return parsed.origin;
};

export const getProxyAuthOrigins = (server: ProxyAuthServer): string[] => {
    if (!server.proxyAuth?.enabled || !server.proxyAuth.username.trim()) {
        return [];
    }

    const origins = [normalizeUrlToOrigin(server.url), normalizeUrlToOrigin(server.remoteUrl)];

    return [...new Set(origins.filter((origin): origin is string => origin !== null))];
};

export const isProxyBasicAuthConfigured = (
    server?: null | ProxyAuthServer,
): server is ProxyAuthServer & { proxyAuth: ProxyBasicAuthConfig } => {
    return Boolean(server?.proxyAuth?.enabled && server.proxyAuth.username.trim());
};

export const createBasicAuthorizationHeader = (username: string, password: string): string => {
    const globalEncoding = globalThis as GlobalWithEncoding;
    const value = `${username}:${password}`;
    const nodeBuffer = globalEncoding.Buffer;

    if (nodeBuffer) {
        return `Basic ${nodeBuffer.from(value, 'utf8').toString('base64')}`;
    }

    const bytes = new TextEncoder().encode(value);
    const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
    const btoa = globalEncoding.btoa;

    if (!btoa) {
        throw new Error('No base64 encoder is available');
    }

    return `Basic ${btoa(binary)}`;
};

export const withUrlBasicAuth = (rawUrl: string, username: string, password: string): string => {
    if (!username.trim() || !password) {
        return rawUrl;
    }

    const parsed = toUrl(rawUrl);

    if (!parsed) {
        return rawUrl;
    }

    parsed.username = username;
    parsed.password = password;

    return parsed.toString();
};

export const redactProxyAuthFromText = (value: string) => {
    return value
        .replace(/\bBasic\s+[A-Za-z0-9+/=]+/g, 'Basic <redacted>')
        .replace(/(https?:\/\/)([^:@/\s]+):([^@/\s]+)@/gi, '$1<proxy-auth>@');
};
