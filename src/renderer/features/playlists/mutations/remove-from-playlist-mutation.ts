import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { RemoveFromPlaylistArgs, RemoveFromPlaylistResponse } from '/@/shared/types/domain-types';

export const useRemoveFromPlaylist = (options?: MutationOptions) => {
    const queryClient = useQueryClient();

    return useMutation<RemoveFromPlaylistResponse, AxiosError, RemoveFromPlaylistArgs, null>({
        mutationFn: (args) => {
            return api.controller.removeFromPlaylist({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onError: (error, variables) => {
            logFn.error('Remove from playlist failed', {
                category: LogCategory.API,
                meta: {
                    message: error?.message,
                    playlistId: variables.query.id,
                    serverId: variables.apiClientProps.serverId,
                },
            });
            options?.onError?.(error);
        },
        onSuccess: (_data, variables) => {
            const { apiClientProps } = variables;
            const serverId = apiClientProps.serverId;

            if (!serverId) return;

            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.list(serverId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.detail(serverId, variables.query.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.songList(serverId, variables.query.id),
            });
        },
        ...options,
    });
};
