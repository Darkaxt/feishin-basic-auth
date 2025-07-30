import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { RMutationHookArgs } from '/@/renderer/lib/react-query';
import { useServerById } from '/@/renderer/store';
import { UpdatePlaylistResponse } from '/@/shared/types/domain/playlist-domain-types';

export const useUpdatePlaylist = (args: RMutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        UpdatePlaylistResponse,
        AxiosError,
        Omit<UpdatePlaylistArgs, 'apiClientProps' | 'server'>,
        null
    >({
        mutationFn: (args) => {
            const server = useServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.updatePlaylist({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_data, variables) => {
            const { query, serverId } = variables;

            if (!serverId) return;

            queryClient.invalidateQueries(queryKeys.playlists.list(serverId));

            if (query?.id) {
                queryClient.invalidateQueries(queryKeys.playlists.detail(serverId, query.id));
            }
        },
        ...options,
    });
};
