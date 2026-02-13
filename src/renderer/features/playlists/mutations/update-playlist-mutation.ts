import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { UpdatePlaylistArgs, UpdatePlaylistResponse } from '/@/shared/types/domain-types';

export const useUpdatePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<UpdatePlaylistResponse, AxiosError, UpdatePlaylistArgs, null>({
        mutationFn: (args) => {
            return api.controller.updatePlaylist({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onError: (error, variables) => {
            logFn.error('Update playlist failed', {
                category: LogCategory.API,
                meta: {
                    message: error?.message,
                    playlistId: variables.query?.id,
                    serverId: variables.apiClientProps.serverId,
                },
            });
            options?.onError?.(error);
        },
        onSuccess: (_data, variables) => {
            const { apiClientProps, query } = variables;
            const serverId = apiClientProps.serverId;

            if (!serverId) return;

            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.list(serverId),
            });

            if (query?.id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.detail(serverId, query.id),
                });
            }
        },
        ...options,
    });
};
