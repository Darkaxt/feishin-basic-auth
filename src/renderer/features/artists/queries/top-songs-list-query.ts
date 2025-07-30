import type { RQueryHookArgs } from '/@/renderer/lib/react-query';

import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useServerById } from '/@/renderer/store';
import { TopSongListQuery } from '/@/shared/types/domain/song-domain-types';

export const useTopSongsList = (args: RQueryHookArgs<TopSongListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getTopSongs({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.albumArtists.topSongs(server?.id || '', query),
        ...options,
    });
};
