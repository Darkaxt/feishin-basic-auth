import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { RMutationHookArgs } from '/@/renderer/lib/react-query';
import { useServerById } from '/@/renderer/store';
import { CreatePlaylistResponse } from '/@/shared/types/domain/playlist-domain-types';

export const useCreatePlaylist = (args: RMutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        CreatePlaylistResponse,
        AxiosError,
        Omit<CreatePlaylistArgs, 'apiClientProps' | 'server'>,
        null
    >({
        mutationFn: (args) => {
            const server = useServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.createPlaylist({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_args, variables) => {
            const server = useServerById(variables.serverId);
            if (server) {
                queryClient.invalidateQueries(queryKeys.playlists.list(server.id));
            }
        },
        ...options,
    });
};
