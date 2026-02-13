import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { AnyLibraryItems, ShareItemArgs, ShareItemResponse } from '/@/shared/types/domain-types';

export const useShareItem = (args: MutationHookArgs) => {
    const { options } = args || {};

    return useMutation<
        ShareItemResponse,
        AxiosError,
        ShareItemArgs,
        { previous: undefined | { items: AnyLibraryItems } }
    >({
        mutationFn: (args) => {
            return api.controller.shareItem({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onError: (error, variables) => {
            logFn.error('Share item failed', {
                category: LogCategory.API,
                meta: {
                    itemType: variables.body?.resourceType,
                    message: error?.message,
                    serverId: variables.apiClientProps.serverId,
                },
            });
            options?.onError?.(error);
        },
        retry: false,
        ...options,
    });
};
