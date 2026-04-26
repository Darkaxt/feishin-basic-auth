import type { Session } from 'electron';

import { ipcMain, safeStorage } from 'electron';

import { store } from '/@/main/features/core/settings';
import { createBasicAuthorizationHeader, normalizeUrlToOrigin } from '/@/shared/utils/proxy-auth';

type ProxyAuthSyncConfig = {
    enabled?: boolean;
    origins: string[];
    secretKey: string;
    username: string;
};

const proxyAuthHeadersByOrigin = new Map<string, string>();
const installedSessions = new WeakSet<Session>();

const decryptSecret = (secretKey: string): null | string => {
    if (!safeStorage.isEncryptionAvailable()) {
        return null;
    }

    const passwords = store.get('server') as Record<string, string> | undefined;
    const encrypted = passwords?.[secretKey];

    if (!encrypted) {
        return null;
    }

    try {
        return safeStorage.decryptString(Buffer.from(encrypted, 'hex'));
    } catch {
        return null;
    }
};

export const syncProxyAuthHeaders = (configs: ProxyAuthSyncConfig[]) => {
    proxyAuthHeadersByOrigin.clear();

    for (const config of configs) {
        if (!config.enabled || !config.username.trim()) {
            continue;
        }

        const password = decryptSecret(config.secretKey);

        if (!password) {
            continue;
        }

        const header = createBasicAuthorizationHeader(config.username, password);

        for (const origin of config.origins) {
            const normalizedOrigin = normalizeUrlToOrigin(origin);

            if (normalizedOrigin) {
                proxyAuthHeadersByOrigin.set(normalizedOrigin, header);
            }
        }
    }
};

ipcMain.on('proxy-auth-sync', (_event, configs: ProxyAuthSyncConfig[]) => {
    syncProxyAuthHeaders(Array.isArray(configs) ? configs : []);
});

export const installProxyAuthInterceptor = (session: Session) => {
    if (installedSessions.has(session)) {
        return;
    }

    installedSessions.add(session);

    session.webRequest.onBeforeSendHeaders((details, callback) => {
        const origin = normalizeUrlToOrigin(details.url);
        const header = origin ? proxyAuthHeadersByOrigin.get(origin) : undefined;

        if (!header) {
            callback({ requestHeaders: details.requestHeaders });
            return;
        }

        const requestHeaders = { ...details.requestHeaders };
        const hasAuthorizationHeader = Object.keys(requestHeaders).some(
            (key) => key.toLowerCase() === 'authorization',
        );

        if (!hasAuthorizationHeader) {
            requestHeaders.Authorization = header;
        }

        callback({ requestHeaders });
    });
};
