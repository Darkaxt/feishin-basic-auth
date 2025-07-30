import type { RQueryHookArgs } from '/@/renderer/lib/react-query';

import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useServerById } from '/@/renderer/store';
import { GenreListQuery } from '/@/shared/types/domain/genre-domain-types';

export const useGenreList = (args: RQueryHookArgs<GenreListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getGenreList({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.genres.list(server?.id || '', query),
        staleTime: 1000 * 5,
        ...options,
    });
};
