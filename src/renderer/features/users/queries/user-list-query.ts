import type { RQueryHookArgs } from '/@/renderer/lib/react-query';

import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useServerById } from '/@/renderer/store';
import { UserListQuery } from '/@/shared/types/domain/user-domain-types';

export const useUserList = (args: RQueryHookArgs<UserListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = useServerById(serverId);

    return useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            api.controller.getUserList({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.users.list(server?.id || '', query),
        ...options,
    });
};
