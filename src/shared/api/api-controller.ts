import { adapter as subsonicAdapter } from './subsonic/subsonic-controller';

import i18n from '/@/i18n/i18n';
import { ApiController } from '/@/shared/types/adapter/api-controller-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';

interface ApiControllerOptions {
    type: ServerType;
}

const adapters = {
    [ServerType.JELLYFIN]: {},
    [ServerType.NAVIDROME]: {},
    [ServerType.SUBSONIC]: subsonicAdapter,
} as Record<ServerType, ApiController>;

export const apiController = (options: ApiControllerOptions): ApiController => {
    const { type } = options;

    const adapter = adapters[type];

    if (!adapter) {
        throw new Error(i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' }));
    }

    return adapter;
};
