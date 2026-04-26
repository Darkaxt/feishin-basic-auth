import isElectron from 'is-electron';

import {
    getProxyAuthOrigins,
    getProxyBasicAuthSecretKey,
    isProxyBasicAuthConfigured,
    ProxyAuthServer,
} from '/@/shared/utils/proxy-auth';

export type ProxyAuthSyncConfig = {
    enabled: boolean;
    origins: string[];
    secretKey: string;
    username: string;
};

const ipc = typeof window !== 'undefined' && isElectron() ? window.api.ipc : null;

export const getProxyAuthSyncConfig = (
    server: ProxyAuthServer,
): ProxyAuthSyncConfig | undefined => {
    if (!isProxyBasicAuthConfigured(server)) {
        return undefined;
    }

    const origins = getProxyAuthOrigins(server);

    if (origins.length === 0) {
        return undefined;
    }

    return {
        enabled: true,
        origins,
        secretKey: getProxyBasicAuthSecretKey(server.id),
        username: server.proxyAuth.username,
    };
};

export const syncProxyAuthToMain = (servers: Array<null | ProxyAuthServer | undefined>) => {
    if (!ipc) {
        return;
    }

    const configs = servers.flatMap((server) => {
        if (!server) {
            return [];
        }

        const config = getProxyAuthSyncConfig(server);

        return config ? [config] : [];
    });

    ipc.send('proxy-auth-sync', configs);
};
