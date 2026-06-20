import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
    getLidaClipsQueryFromSong,
    lidaClipsQueries,
} from '/@/renderer/features/lidaclips/api/lidaclips-api';
import { useAuthStore, useLidaClipsSettings, usePlayerSong } from '/@/renderer/store';
import { createLidaClipsProxyAuthSourceFromServer } from '/@/shared/utils/lidaclips';

export const useLidaClipsCurrentSongLookup = (enabled: boolean) => {
    const currentSong = usePlayerSong();
    const settings = useLidaClipsSettings();
    const songServer = useAuthStore((state) =>
        currentSong?._serverId ? state.serverList[currentSong._serverId] : null,
    );

    const lookupQuery = useMemo(() => getLidaClipsQueryFromSong(currentSong), [currentSong]);
    const proxyAuth = useMemo(
        () => createLidaClipsProxyAuthSourceFromServer(songServer),
        [songServer],
    );

    const { data, isLoading } = useQuery(
        lidaClipsQueries.clip({
            options: {
                enabled: Boolean(enabled && settings.enabled && lookupQuery),
            },
            proxyAuth,
            query: lookupQuery ?? { album: '', artist: '', track: '' },
            settings,
        }),
    );
    const clipStreamUrl = data?.status === 'ok' ? data.clip.localStreamUrl : null;

    return {
        clipStreamUrl,
        currentSong,
        data,
        isLoading,
        lookupQuery,
        settings,
    };
};
