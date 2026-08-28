import { useQueryClient } from '@tanstack/react-query';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    updateQueueSong,
    usePlayerActions,
    usePlayerHydrated,
    usePlayerSong,
    usePlayerStore,
} from '/@/renderer/store/player.store';
import { logger } from '/@/renderer/utils/logger';
import { QueueSong, SongDetailQuery } from '/@/shared/types/domain-types';
import { isSongNotFoundError } from '/@/shared/utils/song-availability';

export const useUpdateCurrentSong = () => {
    const queryClient = useQueryClient();
    const currentSong = usePlayerSong();
    const playerHydrated = usePlayerHydrated();
    const { removeUnavailableSong } = usePlayerActions();

    const handleSongChange = useCallback(
        async (properties: { index: number; song: QueueSong | undefined }) => {
            const currentSong = properties.song;

            if (!currentSong?.id || !currentSong?._serverId) {
                return;
            }

            const queryFilter: SongDetailQuery = { id: currentSong.id };
            const queryKey = queryKeys.songs.detail(currentSong._serverId, queryFilter);

            try {
                const updatedSong = await queryClient.fetchQuery({
                    queryFn: async ({ signal }) =>
                        api.controller.getSongDetail({
                            apiClientProps: {
                                serverId: currentSong._serverId,
                                signal,
                                silent: true,
                            },
                            query: queryFilter,
                        }),
                    queryKey,
                    retry: false,
                });

                if (updatedSong) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { _uniqueId, ...currentSongData } = currentSong;

                    if (!isEqual(currentSongData, updatedSong)) {
                        updateQueueSong(currentSong.id, updatedSong);

                        logger.debug('Differences found, updating song in queue', {
                            id: currentSong.id,
                            name: updatedSong.name,
                        });
                    }
                }
            } catch (error) {
                const latestSong = usePlayerStore.getState().getCurrentSong();
                if (isSongNotFoundError(error) && latestSong?._uniqueId === currentSong._uniqueId) {
                    logger.warn('Removing unavailable song from queue', {
                        id: currentSong.id,
                        name: currentSong.name,
                    });
                    queryClient.removeQueries({ exact: true, queryKey });
                    removeUnavailableSong(currentSong._uniqueId);
                    return;
                }

                logger.error('Failed to update song in queue', {
                    error: error instanceof Error ? error.message : String(error),
                    id: currentSong.id,
                });
            }
        },
        [queryClient, removeUnavailableSong],
    );

    useEffect(() => {
        if (!playerHydrated || !currentSong) {
            return;
        }

        handleSongChange({
            index: usePlayerStore.getState().player.index,
            song: currentSong,
        });
    }, [currentSong, handleSongChange, playerHydrated]);
};

export const UpdateCurrentSongHook = () => {
    useUpdateCurrentSong();
    return null;
};
