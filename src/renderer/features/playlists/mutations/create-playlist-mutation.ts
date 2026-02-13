import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { CreatePlaylistArgs, CreatePlaylistResponse } from '/@/shared/types/domain-types';

export const useCreatePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<CreatePlaylistResponse, AxiosError, CreatePlaylistArgs, null>({
        mutationFn: (args) => {
            return api.controller.createPlaylist({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onError: (error, variables) => {
            logFn.error('Create playlist failed', {
                category: LogCategory.API,
                meta: {
                    message: error?.message,
                    serverId: variables.apiClientProps.serverId,
                },
            });
            options?.onError?.(error);
        },
        onSuccess: (_args, variables) => {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.playlists.list(variables.apiClientProps.serverId),
            });
        },
        ...options,
    });
};
