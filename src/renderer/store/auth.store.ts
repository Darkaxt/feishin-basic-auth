import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { useAlbumArtistListDataStore } from '/@/renderer/store/album-artist-list-data.store';
import { useAlbumListDataStore } from '/@/renderer/store/album-list-data.store';
import { useListStore } from '/@/renderer/store/list.store';
import { createSelectors } from '/@/renderer/store/utils';
import { ServerListItem } from '/@/shared/types/domain/server-domain-types';

export interface AuthSlice extends AuthState {
    actions: Actions;
}

export interface AuthState {
    currentServerId: null | string;
    deviceId: string;
    serverList: Record<string, ServerListItem>;
}

interface Actions {
    addServer: (args: ServerListItem) => void;
    deleteServer: (id: string) => void;
    setCurrentServer: (server: null | ServerListItem) => void;
    updateServer: (id: string, args: Partial<ServerListItem>) => void;
}

const authStoreBase = create<AuthSlice>()(
    persist(
        devtools(
            subscribeWithSelector(
                immer((set) => ({
                    actions: {
                        addServer: (args) => {
                            set((state) => {
                                state.serverList[args.id] = args;
                                state.currentServerId = args.id;
                            });
                        },
                        deleteServer: (id) => {
                            set((state) => {
                                delete state.serverList[id];

                                if (state.currentServerId === id) {
                                    state.currentServerId = null;
                                }
                            });
                        },
                        setCurrentServer: (server) => {
                            set((state) => {
                                state.currentServerId = server?.id || null;

                                if (server) {
                                    // Reset list filters
                                    useListStore.getState()._actions.resetFilter();

                                    // Reset persisted grid list stores
                                    useAlbumListDataStore.getState().actions.setItemData([]);
                                    useAlbumArtistListDataStore.getState().actions.setItemData([]);
                                }
                            });
                        },
                        updateServer: (id: string, args: Partial<ServerListItem>) => {
                            set((state) => {
                                const updatedServer = {
                                    ...state.serverList[id],
                                    ...args,
                                };

                                state.serverList[id] = updatedServer as ServerListItem;
                            });
                        },
                    },
                    currentServerId: null,
                    deviceId: nanoid(),
                    serverList: {},
                })),
            ),
            { name: 'store_authentication' },
        ),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_authentication',
            version: 2,
        },
    ),
);

export const useAuthStore = createSelectors(authStoreBase);

export const useCurrentServerId = () => {
    return useAuthStore.use.currentServerId();
};

export const useCurrentServer = () => {
    const currentServerId = useCurrentServerId();

    if (!currentServerId) {
        return null;
    }

    const servers = useAuthStore.use.serverList();
    const server = servers[currentServerId];

    if (!server) {
        return null;
    }

    return server;
};

export const useServerList = () => useAuthStore.use.serverList();

export const useAuthStoreActions = () => useAuthStore.use.actions();

export const useServerById = (id: string) => {
    const servers = useAuthStore.use.serverList();
    const server = servers[id];

    if (!server) {
        return null;
    }

    return server;
};
