import merge from 'lodash/merge';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { sanitizeLidaClipsRuntimeState } from '/@/shared/utils/lidaclips';

export interface FullScreenPlayerSlice extends FullScreenPlayerState {
    actions: {
        setStore: (data: Partial<FullScreenPlayerSlice>) => void;
    };
}

interface FullScreenPlayerState {
    activeTab: 'lyrics' | 'queue' | 'related' | string;
    clipModeActive: boolean;
    clipModeTransferRatio?: null | number;
    clipModeTransferSongUniqueId?: null | string;
    dynamicBackground?: boolean;
    dynamicImageBlur: number;
    dynamicIsImage?: boolean;
    expanded: boolean;
    opacity: number;
    useImageAspectRatio: boolean;
    visualizerExpanded: boolean;
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
                activeTab: 'queue',
                clipModeActive: false,
                clipModeTransferRatio: null,
                clipModeTransferSongUniqueId: null,
                dynamicBackground: true,
                dynamicImageBlur: 1.5,
                dynamicIsImage: false,
                expanded: false,
                opacity: 60,
                useImageAspectRatio: false,
                visualizerExpanded: false,
            })),
            { name: 'store_full_screen_player' },
        ),
        {
            merge: (persistedState, currentState) => {
                return merge(currentState, persistedState);
            },
            migrate: (persistedState, version) => {
                if (version <= 2) {
                    return {} as FullScreenPlayerState;
                }

                if (version <= 3) {
                    return {
                        ...(persistedState as FullScreenPlayerState),
                        clipModeActive: false,
                    };
                }

                if (version <= 4) {
                    return {
                        ...(persistedState as FullScreenPlayerState),
                        clipModeTransferRatio: null,
                        clipModeTransferSongUniqueId: null,
                    };
                }

                if (version <= 5) {
                    return sanitizeLidaClipsRuntimeState(persistedState as FullScreenPlayerState);
                }

                return persistedState;
            },
            name: 'store_full_screen_player',
            partialize: (state) => sanitizeLidaClipsRuntimeState(state),
            version: 6,
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
