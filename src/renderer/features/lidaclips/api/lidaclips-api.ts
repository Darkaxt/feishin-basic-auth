import { queryOptions } from '@tanstack/react-query';
import isElectron from 'is-electron';

import { QueueSong } from '/@/shared/types/domain-types';
import {
    createLidaClipsLookupQueryFromSong,
    LidaClipsLookupQuery,
    LidaClipsLookupResult,
    LidaClipsServerProxyAuthSource,
    LidaClipsSettings,
} from '/@/shared/utils/lidaclips';

const lidaClips = isElectron() ? window.api.lidaClips : null;

const disabledResult: LidaClipsLookupResult = {
    status: 'disabled',
};

type LidaClipsQueryArgs = {
    options?: {
        enabled?: boolean;
    };
    proxyAuth?: LidaClipsServerProxyAuthSource;
    query: LidaClipsLookupQuery;
    settings: LidaClipsSettings;
};

export const lidaClipsQueries = {
    clip: (args: LidaClipsQueryArgs) => {
        return queryOptions({
            gcTime: 1000 * 60 * 10,
            queryFn: async (): Promise<LidaClipsLookupResult> => {
                if (!lidaClips || !args.settings.enabled) {
                    return disabledResult;
                }

                return lidaClips.lookup({
                    proxyAuth: args.proxyAuth ?? null,
                    query: args.query,
                    settings: args.settings,
                });
            },
            queryKey: [
                'lidaClips',
                'clip',
                args.settings.enabled,
                args.settings.baseUrl,
                args.proxyAuth?.enabled ?? false,
                args.proxyAuth?.secretKey ?? '',
                args.proxyAuth?.username ?? '',
                args.query.artist,
                args.query.album ?? '',
                args.query.track,
            ],
            staleTime: 1000 * 60 * 10,
            ...args.options,
        });
    },
};

export const getLidaClipsQueryFromSong = (song?: null | QueueSong): LidaClipsLookupQuery | null => {
    return createLidaClipsLookupQueryFromSong(song);
};
