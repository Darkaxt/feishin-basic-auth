import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import {
    UpdateInternetRadioStationArgs,
    UpdateInternetRadioStationResponse,
} from '/@/shared/types/domain-types';

export const useUpdateRadioStation = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        UpdateInternetRadioStationResponse,
        AxiosError,
        UpdateInternetRadioStationArgs,
        null
    >({
        mutationFn: (args) => {
            return api.controller.updateInternetRadioStation({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onError: (error, variables) => {
            logFn.error('Update radio station failed', {
                category: LogCategory.API,
                meta: {
                    message: error?.message,
                    serverId: variables.apiClientProps.serverId,
                    stationId: variables.query?.id,
                },
            });
            options?.onError?.(error);
        },
        onSuccess: (_args, variables) => {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.radio.list(variables.apiClientProps.serverId),
            });
        },
        ...options,
    });
};
