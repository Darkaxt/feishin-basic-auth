import { queryOptions } from '@tanstack/react-query';

import { logFn } from '/@/renderer/utils/logger';

async function searchYoutube(query: string): Promise<Array<{ type: string; videoId?: string }>> {
    if (typeof window !== 'undefined' && window.api?.youtube) {
        return window.api.youtube.search(query);
    }
    return [];
}

export const youtubeQueries = {
    search: (args: { query: string }) => {
        return queryOptions({
            gcTime: 1000 * 60 * 5,
            queryFn: async () => {
                const results = await searchYoutube(args.query);
                logFn.debug('Youtube API queried', { meta: { query: args.query, results } });
                return results;
            },
            queryKey: ['youtube', 'search', args.query],
            staleTime: 1000 * 60 * 5,
        });
    },
};
