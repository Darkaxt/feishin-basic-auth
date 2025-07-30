import type {
    DefaultOptions,
    UseInfiniteQueryOptions,
    UseMutationOptions,
    UseQueryOptions,
} from '@tanstack/react-query';

import { QueryCache, QueryClient } from '@tanstack/react-query';

import { toast } from '/@/shared/components/toast/toast';

const queryCache = new QueryCache({
    onError: (error: any, query) => {
        if (query.state.data !== undefined) {
            toast.show({ message: `${error.message}`, type: 'error' });
        }
    },
});

const queryConfig: DefaultOptions = {
    mutations: {
        retry: process.env.NODE_ENV === 'production',
    },
    queries: {
        gcTime: 1000 * 60 * 3,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: process.env.NODE_ENV === 'production',
        staleTime: 1000 * 5,
    },
};

export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
    queryCache,
});

export type InfiniteQueryOptions = {
    enabled?: UseInfiniteQueryOptions['enabled'];
    gcTime?: UseInfiniteQueryOptions['gcTime'];
    meta?: UseInfiniteQueryOptions['meta'];
    onError?: (err: any) => void;
    queryKey?: UseInfiniteQueryOptions['queryKey'];
    refetchInterval?: number;
    refetchIntervalInBackground?: UseInfiniteQueryOptions['refetchIntervalInBackground'];
    refetchOnWindowFocus?: boolean;
    retry?: UseInfiniteQueryOptions['retry'];
    retryDelay?: UseInfiniteQueryOptions['retryDelay'];
    staleTime?: UseInfiniteQueryOptions['staleTime'];
    useErrorBoundary?: boolean;
};

export type RMutationHookArgs = {
    options?: RMutationOptions;
};

export type RMutationOptions = {
    mutationKey: UseMutationOptions['mutationKey'];
    onError?: (err: any) => void;
    onSettled?: any;
    onSuccess?: any;
    retry?: UseQueryOptions['retry'];
    retryDelay?: UseQueryOptions['retryDelay'];
    useErrorBoundary?: boolean;
};

export type RQueryHookArgs<T> = {
    options?: RQueryOptions;
    query: T;
    serverId: string | undefined;
};

export type RQueryOptions = {
    enabled?: UseQueryOptions['enabled'];
    gcTime?: UseQueryOptions['gcTime'];
    meta?: UseQueryOptions['meta'];
    onError?: (err: any) => void;
    queryKey?: UseQueryOptions['queryKey'];
    refetchInterval?: number;
    refetchIntervalInBackground?: UseQueryOptions['refetchIntervalInBackground'];
    refetchOnWindowFocus?: boolean;
    retry?: UseQueryOptions['retry'];
    retryDelay?: UseQueryOptions['retryDelay'];
    staleTime?: UseQueryOptions['staleTime'];
    useErrorBoundary?: boolean;
};
