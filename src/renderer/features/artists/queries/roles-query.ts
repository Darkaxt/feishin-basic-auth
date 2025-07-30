import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { RQueryHookArgs } from '/@/renderer/lib/react-query';
import { useServerById } from '/@/renderer/store';

export const useRoles = (args: RQueryHookArgs<object>) => {
    const { options, serverId } = args;
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!serverId,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getRoles({
                apiClientProps: {
                    server,
                    signal,
                },
            });
        },
        queryKey: queryKeys.roles.list(serverId || ''),
        ...options,
    });
};
