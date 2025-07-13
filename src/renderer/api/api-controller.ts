import { getServerById } from '/@/renderer/store';
import {
    controller as subsonicAdapter,
    apiClient as subsonicApiClient,
    middleware as subsonicMiddleware,
} from '/@/shared/api/subsonic/subsonic-controller';
import { ApiController } from '/@/shared/types/adapter/api-controller-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';

export const serverApi = {
    [ServerType.JELLYFIN]: {
        apiClient: null,
        controller: {},
        middleware: null,
    },
    [ServerType.NAVIDROME]: {
        apiClient: null,
        controller: {},
        middleware: null,
    },
    [ServerType.SUBSONIC]: {
        apiClient: subsonicApiClient,
        controller: subsonicAdapter,
        middleware: subsonicMiddleware,
    },
};

export const api = (serverId: string): ApiController => {
    const server = getServerById(serverId);

    if (!server) {
        throw new Error('No server or api client selected');
    }

    const { apiClient, controller, middleware } = serverApi[server.type];

    if (middleware) {
        apiClient.use(middleware(server));
    }

    if (!apiClient) {
        throw new Error('No api client found');
    }

    return controller as ApiController;
};
