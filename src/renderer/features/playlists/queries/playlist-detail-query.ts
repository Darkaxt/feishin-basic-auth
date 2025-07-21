import type { QueryHookArgs } from '/@/renderer/lib/react-query';

import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useServerById } from '/@/renderer/store';
import { PlaylistDetailQuery } from '/@/shared/types/domain/playlist-domain-types';

export const usePlaylistDetail = (args: QueryHookArgs<PlaylistDetailQuery>) => {
    const { options, query, serverId } = args || {};
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getPlaylistDetail({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.playlists.detail(server?.id || '', query.id, query),
        ...options,
    });
};
