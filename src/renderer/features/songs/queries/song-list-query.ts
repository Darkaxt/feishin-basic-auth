import type { RQueryHookArgs } from '/@/renderer/lib/react-query';

import { useQuery } from '@tanstack/react-query';

import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useServerById } from '/@/renderer/store';
import { SongListQuery } from '/@/shared/types/domain/song-domain-types';

export const useSongList = (args: RQueryHookArgs<SongListQuery>, imageSize?: number) => {
    const { options, query, serverId } = args || {};
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return controller.getSongList({
                apiClientProps: { server, signal },
                query: { ...query, imageSize },
            });
        },
        queryKey: queryKeys.songs.list(server?.id || '', { ...query, imageSize }),
        ...options,
    });
};
