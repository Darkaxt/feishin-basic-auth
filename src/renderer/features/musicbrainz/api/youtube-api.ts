import { queryOptions } from '@tanstack/react-query';

async function searchYoutube(query: string): Promise<Array<{ type: string; videoId?: string }>> {
    if (typeof window !== 'undefined' && window.api?.youtube) {
        return window.api.youtube.search(query);
    }
    return [];
}

export const youtubeQueries = {
    search: (args: { query: string }) => {
        return queryOptions({
            queryFn: () => searchYoutube(args.query),
            queryKey: ['youtube', 'search', args.query],
        });
    },
};
