import merge from 'lodash/merge';
import omit from 'lodash/omit';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { sanitizeLidaClipsRuntimeState } from '/@/shared/utils/lidaclips';

export type FullScreenPlayerItemAlignment = 'center' | 'left' | 'right';

export interface FullScreenPlayerSlice extends FullScreenPlayerState {
    actions: {
        setStore: (data: Partial<FullScreenPlayerSlice>) => void;
    };
}

export type FullScreenPlayerTitleDisplayType = 'multiLine' | 'scroll';

interface FullScreenPlayerState {
    activeTab: 'lyrics' | 'queue' | 'related' | string;
    clipModeActive: boolean;
    clipModeTransferRatio?: null | number;
    clipModeTransferSongUniqueId?: null | string;
    coverArtSize: number;
    dynamicBackground?: boolean;
    dynamicImageBlur: number;
    dynamicIsImage?: boolean;
    expanded: boolean;
    opacity: number;
    playerItemAlignment: FullScreenPlayerItemAlignment;
    shrinkVinylArtworkOnPause: boolean;
    titleDisplayType: FullScreenPlayerTitleDisplayType;
    titleLineCount: number;
    useImageAspectRatio: boolean;
    vinylArtworkEnabled: boolean;
    visualizerExpanded: boolean;
    visualizerReturnToPlayer: boolean;
}

export const useFullScreenPlayerStore = createWithEqualityFn<FullScreenPlayerSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    setStore: (data) => {
                        set({ ...get(), ...data });
                    },
                },
                activeTab: '',
                clipModeActive: false,
                clipModeTransferRatio: null,
                clipModeTransferSongUniqueId: null,
                coverArtSize: 75,
                dynamicBackground: true,
                dynamicImageBlur: 6,
                dynamicIsImage: false,
                expanded: false,
                opacity: 25,
                playerItemAlignment: 'center',
                shrinkVinylArtworkOnPause: true,
                titleDisplayType: 'scroll',
                titleLineCount: 1,
                useImageAspectRatio: false,
                vinylArtworkEnabled: false,
                visualizerExpanded: false,
                visualizerReturnToPlayer: false,
            })),
            { name: 'store_full_screen_player' },
        ),
        {
            merge: (persistedState, currentState) => {
                return merge(currentState, persistedState);
            },
            migrate: (persistedState, version) => {
                if (version <= 2) {
                    return {} as FullScreenPlayerSlice;
                }

                if (version <= 4) {
                    const state = persistedState as { coverArtSize?: number | string };
                    const legacyCoverArtSizeMap: Record<string, number> = {
                        large: 100,
                        medium: 75,
                        small: 50,
                    };

                    if (typeof state.coverArtSize === 'string') {
                        state.coverArtSize = legacyCoverArtSizeMap[state.coverArtSize] ?? 75;
                    }
                }

                return sanitizeLidaClipsRuntimeState(
                    persistedState as FullScreenPlayerSlice,
                ) as FullScreenPlayerSlice;
            },
            name: 'store_full_screen_player',
            partialize: (state) =>
                omit(sanitizeLidaClipsRuntimeState(state), [
                    'visualizerReturnToPlayer',
                ]) as FullScreenPlayerSlice,
            version: 8,
        },
    ),
);

export const useFullScreenPlayerStoreActions = () =>
    useFullScreenPlayerStore((state) => state.actions);

export const useSetFullScreenPlayerStore = () =>
    useFullScreenPlayerStore((state) => state.actions.setStore);

export const useFullScreenPlayerOverlayState = () =>
    useFullScreenPlayerStore(
        (state) => ({
            expanded: state.expanded,
            visualizerExpanded: state.visualizerExpanded,
        }),
        shallow,
    );
