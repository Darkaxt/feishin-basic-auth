import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { RQueryHookArgs } from '/@/renderer/lib/react-query';
import { useServerById } from '/@/renderer/store';
import { SearchQuery } from '/@/shared/types/domain/search-domain-types';

export const useSearch = (args: RQueryHookArgs<SearchQuery>) => {
    const { options, query, serverId } = args;
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!serverId,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.search({
                apiClientProps: {
                    server,
                    signal,
                },
                query,
            });
        },
        queryKey: queryKeys.search.list(serverId || '', query),
        ...options,
    });
};
