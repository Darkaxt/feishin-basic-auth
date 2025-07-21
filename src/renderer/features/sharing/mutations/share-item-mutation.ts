import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { useServerById } from '/@/renderer/store';
import { AnyLibraryItems } from '/@/shared/types/domain/shared-domain-types';
import { ShareItemRequest, ShareItemResponse } from '/@/shared/types/domain/user-domain-types';

export const useShareItem = (args: MutationHookArgs) => {
    const { options } = args || {};

    return useMutation<
        ShareItemResponse,
        AxiosError,
        Omit<ShareItemRequest, 'apiClientProps' | 'server'>,
        { previous: undefined | { items: AnyLibraryItems } }
    >({
        mutationFn: (args) => {
            const server = useServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.shareItem({ ...args, apiClientProps: { server } });
        },
        ...options,
    });
};
