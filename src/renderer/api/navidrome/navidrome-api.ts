import { initClient, initContract } from '@ts-rest/core';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, isAxiosError, Method } from 'axios';
import isElectron from 'is-electron';
import omitBy from 'lodash/omitBy';
import qs from 'qs';

import i18n from '/@/i18n/i18n';
import { validateResponse } from '/@/renderer/api/response-validation';
import { authenticationFailure } from '/@/renderer/api/utils';
import { useAuthStore } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { getServerUrl } from '/@/renderer/utils/normalize-server-url';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import { resultWithHeaders } from '/@/shared/api/utils';
import { toast } from '/@/shared/components/toast/toast';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

const c = initContract();

export const contract = c.router({
    addToPlaylist: {
        body: ndType._parameters.addToPlaylist,
        method: 'POST',
        path: 'playlist/:id/tracks',
        responses: {
            200: resultWithHeaders(ndType._response.addToPlaylist),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    authenticate: {
        body: ndType._parameters.authenticate,
        method: 'POST',
        path: 'auth/login',
        responses: {
            200: resultWithHeaders(ndType._response.authenticate),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    createPlaylist: {
        body: ndType._parameters.createPlaylist,
        method: 'POST',
        path: 'playlist',
        responses: {
            200: resultWithHeaders(ndType._response.createPlaylist),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    deleteArtistImage: {
        body: null,
        method: 'DELETE',
        path: 'artist/:id/image',
        responses: {
            200: resultWithHeaders(ndType._response.deleteArtistImage),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    deleteInternetRadioStation: {
        body: null,
        method: 'DELETE',
        path: 'radio/:id',
        responses: {
            200: resultWithHeaders(ndType._response.deleteInternetRadioStation),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    deleteInternetRadioStationImage: {
        body: null,
        method: 'DELETE',
        path: 'radio/:id/image',
        responses: {
            200: resultWithHeaders(ndType._response.deleteInternetRadioStationImage),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    deletePlaylist: {
        body: null,
        method: 'DELETE',
        path: 'playlist/:id',
        responses: {
            200: resultWithHeaders(ndType._response.deletePlaylist),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    deletePlaylistImage: {
        body: null,
        method: 'DELETE',
        path: 'playlist/:id/image',
        responses: {
            200: resultWithHeaders(ndType._response.deletePlaylistImage),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getAlbumArtistDetail: {
        method: 'GET',
        path: 'artist/:id',
        responses: {
            200: resultWithHeaders(ndType._response.albumArtist),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getAlbumArtistList: {
        method: 'GET',
        path: 'artist',
        query: ndType._parameters.albumArtistList,
        responses: {
            200: resultWithHeaders(ndType._response.albumArtistList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getAlbumDetail: {
        method: 'GET',
        path: 'album/:id',
        responses: {
            200: resultWithHeaders(ndType._response.album),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getAlbumList: {
        method: 'GET',
        path: 'album',
        query: ndType._parameters.albumList,
        responses: {
            200: resultWithHeaders(ndType._response.albumList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getGenreList: {
        method: 'GET',
        path: 'genre',
        query: ndType._parameters.genreList,
        responses: {
            200: resultWithHeaders(ndType._response.genreList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getPlaylistDetail: {
        method: 'GET',
        path: 'playlist/:id',
        responses: {
            200: resultWithHeaders(ndType._response.playlist),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getPlaylistList: {
        method: 'GET',
        path: 'playlist',
        query: ndType._parameters.playlistList,
        responses: {
            200: resultWithHeaders(ndType._response.playlistList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getPlaylistSongList: {
        method: 'GET',
        path: 'playlist/:id/tracks',
        query: ndType._parameters.songList,
        responses: {
            200: resultWithHeaders(ndType._response.playlistSongList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getQueue: {
        method: 'GET',
        path: 'queue',
        responses: {
            200: resultWithHeaders(ndType._response.queue),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getRadioList: {
        method: 'GET',
        path: 'radio',
        query: ndType._parameters.radioList,
        responses: {
            200: resultWithHeaders(ndType._response.radioList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getSongDetail: {
        method: 'GET',
        path: 'song/:id',
        responses: {
            200: resultWithHeaders(ndType._response.song),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getSongList: {
        method: 'GET',
        path: 'song',
        query: ndType._parameters.songList,
        responses: {
            200: resultWithHeaders(ndType._response.songList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getTagList: {
        method: 'GET',
        path: 'tag',
        query: ndType._parameters.tagList,
        responses: {
            200: resultWithHeaders(ndType._response.tagList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    getUserList: {
        method: 'GET',
        path: 'user',
        query: ndType._parameters.userList,
        responses: {
            200: resultWithHeaders(ndType._response.userList),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    movePlaylistItem: {
        body: ndType._parameters.moveItem,
        method: 'PUT',
        path: 'playlist/:playlistId/tracks/:trackNumber',
        responses: {
            200: resultWithHeaders(ndType._response.moveItem),
            400: resultWithHeaders(ndType._response.error),
        },
    },
    removeFromPlaylist: {
        body: null,
        method: 'DELETE',
        path: 'playlist/:id/tracks',
        query: ndType._parameters.removeFromPlaylist,
        responses: {
            200: resultWithHeaders(ndType._response.removeFromPlaylist),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    saveQueue: {
        body: ndType._parameters.saveQueue,
        method: 'POST',
        path: 'queue',
        responses: {
            200: resultWithHeaders(ndType._response.saveQueue),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    shareItem: {
        body: ndType._parameters.shareItem,
        method: 'POST',
        path: 'share',
        responses: {
            200: resultWithHeaders(ndType._response.shareItem),
            404: resultWithHeaders(ndType._response.error),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    updateInternetRadioStation: {
        body: ndType._parameters.updateInternetRadioStation,
        method: 'PUT',
        path: 'radio/:id',
        responses: {
            200: resultWithHeaders(ndType._response.updateInternetRadioStation),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    updatePlaylist: {
        body: ndType._parameters.updatePlaylist,
        method: 'PUT',
        path: 'playlist/:id',
        responses: {
            200: resultWithHeaders(ndType._response.updatePlaylist),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    uploadArtistImage: {
        body: ndType._parameters.uploadArtistImage,
        method: 'POST',
        path: 'artist/:id/image',
        responses: {
            200: resultWithHeaders(ndType._response.uploadArtistImage),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    uploadInternetRadioStationImage: {
        body: ndType._parameters.uploadInternetRadioStationImage,
        method: 'POST',
        path: 'radio/:id/image',
        responses: {
            200: resultWithHeaders(ndType._response.uploadInternetRadioStationImage),
            500: resultWithHeaders(ndType._response.error),
        },
    },
    uploadPlaylistImage: {
        body: ndType._parameters.uploadPlaylistImage,
        method: 'POST',
        path: 'playlist/:id/image',
        responses: {
            200: resultWithHeaders(ndType._response.uploadPlaylistImage),
            500: resultWithHeaders(ndType._response.error),
        },
    },
});

const axiosClient = axios.create({});

axiosClient.defaults.paramsSerializer = (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
};

const parsePath = (fullPath: string) => {
    const [path, params] = fullPath.split('?');

    const parsedParams = qs.parse(params);

    // Convert indexed object to array
    const newParams: Record<string, any> = {};
    Object.keys(parsedParams).forEach((key) => {
        const isIndexedArrayObject =
            typeof parsedParams[key] === 'object' &&
            Object.keys(parsedParams[key] || {}).includes('0');

        if (!isIndexedArrayObject) {
            newParams[key] = parsedParams[key];
        } else {
            newParams[key] = Object.values(parsedParams[key] || {});
        }
    });

    const notNilParams = omitBy(newParams, (value) => value === 'undefined' || value === 'null');

    return {
        params: notNilParams,
        path,
    };
};

interface NavidromeRequestConfig extends AxiosRequestConfig {
    authenticationRetried?: boolean;
    serverId?: string;
}

const reauthentications = new Map<string, Promise<void>>();

const renewSession = (server: ServerListItemWithCredential): Promise<void> => {
    const pending = reauthentications.get(server.id);
    if (pending) return pending;

    const renewal = (async () => {
        try {
            const password = await localSettings?.passwordGet(server.id);
            if (!password) {
                authenticationFailure(server);
                throw new Error(i18n.t('error.sessionExpiredError') as string);
            }

            const res = await axios.post(`${server.url}/auth/login`, {
                password,
                username: server.username,
            });
            if (
                res.status !== 200 ||
                typeof res.data.token !== 'string' ||
                typeof res.data.subsonicSalt !== 'string' ||
                typeof res.data.subsonicToken !== 'string'
            ) {
                throw new Error(i18n.t('error.authenticatedFailed') as string);
            }
            const current = useAuthStore.getState().serverList[server.id];
            // An explicit logout, deletion, account edit or replacement owns newer state.
            if (
                !current ||
                useAuthStore.getState().currentServer?.id !== server.id ||
                current.ndCredential !== server.ndCredential ||
                current.url !== server.url ||
                current.username !== server.username
            ) {
                return;
            }
            useAuthStore.getState().actions.updateServer(server.id, {
                credential: `u=${encodeURIComponent(server.username)}&s=${encodeURIComponent(res.data.subsonicSalt)}&t=${encodeURIComponent(res.data.subsonicToken)}`,
                ndCredential: res.data.token,
            });
        } catch (error) {
            const status = isAxiosError(error) ? error.response?.status : undefined;
            if (status === 401 || status === 403) {
                authenticationFailure(server);
            } else if (status === 429) {
                toast.error({
                    message: i18n.t('error.loginRateError') as string,
                    title: i18n.t('error.sessionExpiredError') as string,
                });
            }
            logger.warn('Native session renewal failed', { serverId: server.id, status });
            throw error;
        } finally {
            reauthentications.delete(server.id);
        }
    })();
    reauthentications.set(server.id, renewal);
    return renewal;
};

axiosClient.interceptors.response.use(
    (response) => {
        const serverId = (response.config as NavidromeRequestConfig).serverId;

        if (serverId) {
            const headerCredential = response.headers['x-nd-authorization'] as string | undefined;

            const server = useAuthStore.getState().serverList[serverId];
            if (
                headerCredential &&
                server?.ndCredential &&
                response.config.headers['x-nd-authorization'] === `Bearer ${server.ndCredential}`
            ) {
                useAuthStore.getState().actions.updateServer(serverId, {
                    ndCredential: headerCredential,
                });
            }
        }

        return response;
    },
    async (error) => {
        const config = error.config as NavidromeRequestConfig | undefined;
        if (error.response?.status !== 401 || !config?.serverId || config.signal?.aborted) {
            throw error;
        }
        const server = useAuthStore.getState().serverList[config.serverId];
        if (!server || useAuthStore.getState().currentServer?.id !== server.id) throw error;
        if (config.authenticationRetried) {
            if (config.headers?.['x-nd-authorization'] === `Bearer ${server.ndCredential}`) {
                authenticationFailure(server);
            }
            throw error;
        }
        config.authenticationRetried = true;
        const authorization = config.headers?.['x-nd-authorization'];
        if (!server.ndCredential || authorization === `Bearer ${server.ndCredential}`) {
            if (!localSettings || !server.savePassword) {
                authenticationFailure(server);
                throw error;
            }
            await renewSession(server);
        }
        const latest = useAuthStore.getState().serverList[server.id];
        if (!latest?.ndCredential || useAuthStore.getState().currentServer?.id !== server.id) {
            throw error;
        }
        config.headers = {
            ...config.headers,
            'x-nd-authorization': `Bearer ${latest.ndCredential}`,
        };
        // Resource errors from this replay are handled as resource errors, outside renewal.
        return axiosClient.request(config);
    },
);

export const ndApiClient = (args: {
    forceRemoteUrl?: boolean;
    server: null | ServerListItemWithCredential;
    signal?: AbortSignal;
    url?: string;
}) => {
    const { forceRemoteUrl, server, signal, url } = args;

    return initClient(contract, {
        api: async ({ body, headers, method, path, route }) => {
            let baseUrl: string | undefined;
            let token: string | undefined;

            const { params, path: api } = parsePath(path);

            if (server) {
                const serverUrl = getServerUrl(server, forceRemoteUrl);
                baseUrl = serverUrl ? `${serverUrl}/api` : undefined;
                token = server?.ndCredential;
            } else {
                baseUrl = url;
            }

            try {
                if (server) {
                    await reauthentications.get(server.id);
                    token = useAuthStore.getState().serverList[server.id]?.ndCredential;
                }
                const config: NavidromeRequestConfig = {
                    data: body,
                    headers: {
                        ...headers,
                        ...(token && { 'x-nd-authorization': `Bearer ${token}` }),
                    },
                    method: method as Method,
                    params,
                    serverId: server?.id,
                    signal,
                    url: `${baseUrl}/${api}`,
                };
                const result = await axiosClient.request(config);
                validateResponse({
                    controller: 'Navidrome',
                    method,
                    path: api,
                    response: { data: result.data, headers: result.headers },
                    route,
                    status: result.status,
                });
                return {
                    body: { data: result.data, headers: result.headers },
                    headers: result.headers as any,
                    status: result.status,
                };
            } catch (e: any | AxiosError | Error) {
                if (isAxiosError(e)) {
                    if (e.code === 'ERR_NETWORK') {
                        throw new Error(i18n.t('error.networkError') as string);
                    }

                    const error = e as AxiosError;
                    const response = error.response as AxiosResponse;
                    validateResponse({
                        controller: 'Navidrome',
                        method,
                        path: api,
                        response: { data: response?.data, headers: response?.headers },
                        route,
                        status: response?.status,
                    });
                    return {
                        body: { data: response?.data, headers: response?.headers },
                        headers: response?.headers as any,
                        status: response?.status,
                    };
                }
                throw e;
            }
        },
        baseHeaders: {
            'Content-Type': 'application/json',
        },
        baseUrl: '',
        jsonQuery: false,
    });
};
