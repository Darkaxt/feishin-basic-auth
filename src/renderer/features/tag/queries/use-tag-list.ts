import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { useServerById } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { ServerFeature } from '/@/shared/types/domain/server-domain-types';
import { TagQuery } from '/@/shared/types/domain/tag-domain-types';

export const useTagList = (args: QueryHookArgs<TagQuery>) => {
    const { options, query, serverId } = args || {};
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!server && hasFeature(server, ServerFeature.TAGS),
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getTags({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.tags.list(server?.id || '', query.type),
        staleTime: 1000 * 60,
        ...options,
    });
};
