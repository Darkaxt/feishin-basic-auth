import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import { api } from '/@/renderer/api';
import { youtubeQueries } from '/@/renderer/features/musicbrainz/api/youtube-api';
import { TranscodingConfig } from '/@/renderer/store';
import { QueueSong, ServerType } from '/@/shared/types/domain-types';

const YOUTUBE_WATCH_BASE = 'https://www.youtube.com/watch?v=';

export function useSongUrl(
    song: QueueSong | undefined,
    current: boolean,
    transcode: TranscodingConfig,
): string | undefined {
    const prior = useRef(['', '']);

    const isExternal = song?._serverType === ServerType.EXTERNAL;
    const searchQuery =
        song && isExternal ? `${song.artistName ?? ''} ${song.name ?? ''}`.trim() : '';

    const youtubeSearch = useQuery({
        ...youtubeQueries.search({ query: searchQuery }),
        enabled: Boolean(song && isExternal && searchQuery),
    });

    const externalUrl = useMemo(() => {
        if (!song || !isExternal) return undefined;
        if (current && prior.current[0] === song._uniqueId && prior.current[1]) {
            return prior.current[1];
        }
        const url = getYoutubeUrlFromSearchResults(youtubeSearch.data);
        if (url) prior.current = [song._uniqueId, url];
        return url;
    }, [song, isExternal, current, youtubeSearch.data]);

    return useMemo(() => {
        if (!song) {
            prior.current = ['', ''];
            return undefined;
        }

        if (isExternal) {
            return externalUrl;
        }

        if (song._serverId) {
            if (current && prior.current[0] === song._uniqueId) {
                return prior.current[1];
            }

            const url = api.controller.getStreamUrl({
                apiClientProps: { serverId: song._serverId },
                query: {
                    bitrate: transcode.bitrate,
                    format: transcode.format,
                    id: song.id,
                    transcode: transcode.enabled,
                },
            });

            prior.current = [song._uniqueId, url];
            return url;
        }

        prior.current = ['', ''];
        return undefined;
    }, [
        song,
        isExternal,
        externalUrl,
        current,
        transcode.bitrate,
        transcode.format,
        transcode.enabled,
    ]);
}

function getYoutubeUrlFromSearchResults(
    results: Array<{ type: string; videoId?: string }> | undefined,
): string | undefined {
    if (!results?.length) return undefined;
    const first = results.find((r) => r.type === 'SONG' || r.type === 'VIDEO');
    return first && 'videoId' in first && first.videoId
        ? `${YOUTUBE_WATCH_BASE}${first.videoId}`
        : undefined;
}

export const getSongUrl = (song: QueueSong, transcode: TranscodingConfig) => {
    return api.controller.getStreamUrl({
        apiClientProps: { serverId: song._serverId },
        query: {
            bitrate: transcode.bitrate,
            format: transcode.format,
            id: song.id,
            transcode: transcode.enabled,
        },
    });
};
