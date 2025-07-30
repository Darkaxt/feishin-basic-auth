import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { RQueryHookArgs } from '/@/renderer/lib/react-query';
import { useServerById } from '/@/renderer/store';
import { AlbumListQuery, AlbumListSort } from '/@/shared/types/domain/album-domain-types';
import { ListSortOrder } from '/@/shared/types/domain/shared-domain-types';

export const useRecentlyPlayed = (args: RQueryHookArgs<Partial<AlbumListQuery>>) => {
    const { options, query, serverId } = args;
    const server = useServerById(serverId);

    const requestQuery: AlbumListQuery = {
        limit: 5,
        sortBy: AlbumListSort.RECENTLY_PLAYED,
        sortOrder: ListSortOrder.ASC,
        offset: 0,
        ...query,
    };

    return useQuery({
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getAlbumList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: requestQuery,
            });
        },

        queryKey: queryKeys.albums.list(server?.id || '', requestQuery),
        ...options,
    });
};
