import { createLoggedApiController } from '/@/renderer/api/api-controller-logger';
import { useAuthStore } from '/@/renderer/store';
import {
    createApiClient as subsonicApiClient,
    authenticate as subsonicAuthenticate,
    controller as subsonicController,
    middleware as subsonicMiddleware,
} from '/@/shared/api/subsonic/subsonic-controller';
import { ApiController } from '/@/shared/types/adapter/api-controller-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';

export const serverApiMap = {
    [ServerType.JELLYFIN]: {
        apiClient: null,
        authenticate: null,
        controller: {},
        middleware: null,
    },
    [ServerType.NAVIDROME]: {
        apiClient: null,
        authenticate: null,
        controller: {},
        middleware: null,
    },
    [ServerType.SUBSONIC]: {
        apiClient: subsonicApiClient,
        authenticate: subsonicAuthenticate,
        controller: subsonicController,
        middleware: subsonicMiddleware,
    },
};

const getApiByServer = (serverId: string): ApiController => {
    const servers = useAuthStore.getState().serverList;
    const server = servers[serverId];

    if (!server) {
        throw new Error('No server or api client selected');
    }

    const { apiClient, controller, middleware } = serverApiMap[server.type];

    if (!apiClient) {
        throw new Error('No api client found');
    }

    const client = apiClient(server, middleware);

    return createLoggedApiController(controller(client, server));
};

const getAppApi = () => {
    const servers = useAuthStore.getState().serverList;

    return Object.entries(servers).reduce(
        (acc, [id]) => {
            acc[id] = getApiByServer(id);
            return acc;
        },
        {} as Record<string, ApiController>,
    );
};

export const api = {
    authenticate: (serverType: ServerType) => {
        const { authenticate } = serverApiMap[serverType];

        if (!serverType || !authenticate) {
            throw new Error();
        }

        return authenticate;
    },
    controller: getAppApi(),
};
