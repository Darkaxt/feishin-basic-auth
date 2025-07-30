import md5 from 'md5';
import createClient, { Middleware } from 'openapi-fetch';
import qs from 'qs';

import { components, paths } from './subsonic-schema';

import i18n from '/@/i18n/i18n';
import { normalize } from '/@/shared/api/subsonic/subsonic-normalize';
import { helpers } from '/@/shared/api/utils';
import {
    API_CLIENT_NAME,
    ApiController,
    ApiControllerError,
} from '/@/shared/types/adapter/api-controller-types';
import { AlbumListSortOptions } from '/@/shared/types/domain/album-domain-types';
import { Artist } from '/@/shared/types/domain/artist-domain-types';
import { Genre } from '/@/shared/types/domain/genre-domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem, ListSortOrder } from '/@/shared/types/domain/shared-domain-types';
import { randomString } from '/@/shared/utils/random-string';

export type SubsonicApiClient = ReturnType<typeof createApiClient>;

function deserializeCredential(credential: string): Record<string, string> {
    return JSON.parse(credential);
}

function serializeCredential(username: string, credential: Record<string, string>, type: string) {
    switch (type) {
        case 'apiKey':
            return JSON.stringify({ apiKey: credential.apiKey });
        case 'plaintext':
            return JSON.stringify({ p: credential.password, u: username });
        case 'token':
            return JSON.stringify({ s: credential.s, t: credential.t, u: username });
        default:
            throw new Error(`Invalid credential type: ${type}`);
    }
}

export const createApiClient = (
    server: ServerListItem,
    middleware?: ((server: ServerListItem) => Middleware)[],
) => {
    const client = createClient<paths>({
        baseUrl: server.url,
        querySerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
    });

    if (middleware) {
        client.use(...middleware.map((m) => m(server)));
    }

    return client;
};

const authMiddleware: (server: ServerListItem) => Middleware = (server: ServerListItem) => ({
    onRequest: async ({ params, request }) => {
        const credential = deserializeCredential(server.credential);

        if (params.query) {
            params.query.v = '1.16.1';
            params.query.c = API_CLIENT_NAME;
            params.query.f = 'json';

            for (const [key, value] of Object.entries(credential)) {
                params.query[key] = value;
            }
        }

        const stringifiedParams = qs.stringify(params.query, { arrayFormat: 'repeat' });

        const url = new URL(request.url);
        url.search = stringifiedParams;

        return new Request(url.toString(), {
            body: request.body,
            headers: request.headers,
            method: request.method,
            signal: request.signal,
        });
    },
});

export const middleware = [authMiddleware];

type ErrorResponseArgs = {
    code?: number;
    message?: string;
};

function errorResponse(args: ErrorResponseArgs): [ApiControllerError, null] {
    const message = `${i18n.t('error.genericError', { postProcess: 'sentenceCase' }) as string}${
        args.message ? `: ${args.message}` : ''
    }`;

    return [{ code: args.code || 500, message }, null];
}

function getSubsonicErrorMessage(subsonicErrorCode: number): string {
    switch (subsonicErrorCode) {
        case 0:
            return 'A generic error occurred';
        case 10:
            return 'Required parameter is missing';
        case 20:
            return 'Incompatible Subsonic REST protocol version. Client must upgrade';
        case 30:
            return 'Incompatible Subsonic REST protocol version. Server must upgrade';
        case 40:
            return 'Wrong username or password';
        case 41:
            return 'Token authentication not supported for LDAP users';
        case 50:
            return 'User is not authorized for the given operation';
        case 60:
            return 'The trial period for the Subsonic server is over. Please upgrade to Subsonic Premium';
        case 70:
            return 'The requested data was not found';
        default:
            return 'An unknown error occurred';
    }
}

function subsonicErrorResponse(
    response: components['schemas']['SubsonicError'],
    customMessage?: string,
): [ApiControllerError, null] {
    const errorCode = response.code;
    const errorMessage = response.message;

    const httpStatus = toHttpErrorCode(errorCode);
    const message = customMessage || errorMessage || getSubsonicErrorMessage(errorCode);

    return [{ code: httpStatus, message }, null];
}

function toHttpErrorCode(subsonicErrorCode: number): number {
    switch (subsonicErrorCode) {
        case 0:
            return 500; // Generic error - Internal Server Error
        case 10:
            return 400; // Required parameter is missing - Bad Request
        case 20:
            return 426; // Client must upgrade - Upgrade Required
        case 30:
            return 503; // Server must upgrade - Service Unavailable
        case 40:
            return 401; // Wrong username or password - Unauthorized
        case 41:
            return 403; // Token authentication not supported for LDAP users - Forbidden
        case 50:
            return 403; // User is not authorized for the given operation - Forbidden
        case 60:
            return 402; // Trial period over - Payment Required
        case 70:
            return 404; // The requested data was not found - Not Found
        default:
            return 500; // Unknown error - Internal Server Error
    }
}

export const authenticate = async ({ body, url }) => {
    /*
     * We will attempt to authenticate in three ways:
     * 1. Username and token (md5(password + salt))
     * 2. Username and plaintext password
     * 3. API key https://opensubsonic.netlify.app/docs/extensions/apikeyauth/
     */

    const authUrl = `${url}/rest/getUser`;

    async function tokenAuth(username: string, credential: string) {
        const salt = randomString(12);
        const token = md5(credential + salt);

        const authQuery = {
            s: salt,
            t: token,
            u: username,
        };

        const query = {
            c: API_CLIENT_NAME,
            f: 'json',
            username,
            v: '1.16.1',
            ...authQuery,
        };

        const parsedQuery = qs.stringify(query, { arrayFormat: 'repeat' });

        const result = await fetch(`${authUrl}?${parsedQuery}`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'GET',
        });

        return { authQuery, result };
    }

    async function plaintextAuth(username: string, credential: string) {
        const authQuery = {
            p: credential,
            u: username,
        };

        const query = {
            c: API_CLIENT_NAME,
            f: 'json',
            username,
            v: '1.16.1',
            ...authQuery,
        };

        const parsedQuery = qs.stringify(query, { arrayFormat: 'repeat' });

        const result = await fetch(`${authUrl}?${parsedQuery}`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'GET',
        });

        return { authQuery, result };
    }

    async function apiKeyAuth(username: string, credential: string) {
        const authQuery = {
            apiKey: credential,
            u: username,
        };

        const query = {
            c: API_CLIENT_NAME,
            f: 'json',
            username,
            v: '1.16.1',
            ...authQuery,
        };

        const parsedQuery = qs.stringify(query, { arrayFormat: 'repeat' });

        const result = await fetch(`${authUrl}?${parsedQuery}`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'GET',
        });

        return { authQuery: { ...authQuery }, result };
    }

    let errorMessage: null | string = null;

    const authFunctions = [
        {
            fn: tokenAuth,
            type: 'token',
        },
        {
            fn: apiKeyAuth,
            type: 'apiKey',
        },
        {
            fn: plaintextAuth,
            type: 'plaintext',
        },
    ];

    for (const authFn of authFunctions) {
        const { authQuery, result } = await authFn.fn(body.username, body.password);

        const resultData = await result.json();

        if (resultData.error) {
            continue;
        }

        if (resultData['subsonic-response']?.status !== 'ok') {
            errorMessage = resultData['subsonic-response'].error?.message as unknown as string;
            continue;
        }

        const userResult = resultData['subsonic-response'].user;

        const serializedCredential = serializeCredential(body.username, authQuery, authFn.type);

        const query = {
            c: API_CLIENT_NAME,
            f: 'json',
            v: '1.16.1',
            ...authQuery,
        };

        const parsedQuery = qs.stringify(query, { arrayFormat: 'repeat' });

        const musicFolderUrl = `${url}/rest/getMusicFolders`;

        const musicFolderResult = await fetch(`${musicFolderUrl}?${parsedQuery}`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'GET',
        });

        const musicFolderResultData = await musicFolderResult.json();

        if (!musicFolderResultData || musicFolderResultData['subsonic-response']?.status !== 'ok') {
            errorMessage = musicFolderResultData['subsonic-response'].error
                ?.message as unknown as string;
            continue;
        }

        const musicFolders = (
            musicFolderResultData['subsonic-response'].musicFolders.musicFolder || []
        ).map((folder) => folder.id.toString());

        const user = {
            credential: serializedCredential,
            permissions: {
                'jukebox.manage': userResult.jukeboxRole,
                'media.download': userResult.downloadRole,
                'media.folder': musicFolders,
                'media.share': userResult.shareRole,
                'media.stream': userResult.streamRole,
                'media.upload': userResult.uploadRole,
                'playlist.create': userResult.playlistRole,
                'playlist.delete': userResult.playlistRole,
                'playlist.edit': userResult.playlistRole,
                'server.admin': userResult.adminRole,
                'user.edit': userResult.settingsRole,
            },
            username: userResult.username,
        };

        return [null, user];
    }

    return errorResponse({ message: errorMessage || undefined });
};

export const controller = (client: SubsonicApiClient, server: ServerListItem): ApiController => {
    return {
        _utility: {
            getImageUrl: (
                args: { id: string; size?: number; type: LibraryItem },
                server: ServerListItem,
            ) => {
                return `${server.url}/rest/getCoverArt?id=${args.id}&size=${args.size || 300}`;
            },
            getStreamUrl: (
                args: { bitRate?: number; format?: string; id: string },
                server: ServerListItem,
            ) => {
                return `${server.url}/rest/stream?id=${args.id}&format=${args.format || 'mp3'}&maxBitRate=${args.bitRate || 320}`;
            },
        },
        album: {
            getDetail: async (request, options) => {
                const { data, error } = await client.GET('/rest/getAlbum', {
                    params: { query: { id: request.query.id } },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No album found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, normalize.album(data['subsonic-response'].album, server)];
            },
            getInfo: async (request, options) => {
                const { data, error } = await client.GET('/rest/getAlbumInfo2', {
                    params: { query: { id: request.query.id } },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No album info found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const albumInfo = data['subsonic-response'].albumInfo;
                return [
                    null,
                    {
                        imageUrl: albumInfo?.largeImageUrl || null,
                        notes: albumInfo?.notes || null,
                    },
                ];
            },
            getList: async (request, options) => {
                let reverseResult: boolean = false;
                let offset: number = request.query.offset;
                const fromYear: number | undefined = undefined;
                const toYear: number | undefined = undefined;

                const [err, totalRecordCount] = await controller(client, server).album
                    .getListCount!(request, options);

                if (err) {
                    return errorResponse({ code: 500, message: err.message });
                }

                if (request.query.searchTerm) {
                    if (request.query.limit === -1) {
                        const fetcherFn = async (page: number, limit: number) => {
                            const { data, error } = await client.GET('/rest/search3', {
                                params: {
                                    query: {
                                        albumCount: limit,
                                        albumOffset: page * limit,
                                        artistCount: 0,
                                        artistOffset: 0,
                                        query: request.query.searchTerm || '',
                                        songCount: 0,
                                        songOffset: 0,
                                    },
                                },
                                ...options,
                            });

                            if (error) {
                                throw new Error(error);
                            }

                            if (!data['subsonic-response']) {
                                throw new Error('No response from server');
                            }

                            if (data['subsonic-response'].status !== 'ok') {
                                throw new Error(data['subsonic-response'].error?.message);
                            }

                            return data['subsonic-response'].searchResult3?.album || [];
                        };

                        const results = await helpers.fetchAllRecords({
                            fetcher: fetcherFn,
                            fetchLimit: 500,
                        });

                        const items = results.map((album) => normalize.album(album, server));

                        const sorted = helpers.sortBy.album(
                            items,
                            request.query.sortBy,
                            request.query.sortOrder,
                        );

                        const paginatedResults = helpers.paginate(
                            sorted,
                            request.query.offset,
                            request.query.limit,
                        );

                        return [null, paginatedResults];
                    }

                    if (request.query.sortOrder === ListSortOrder.DESC) {
                        offset = totalRecordCount - offset - request.query.limit;
                        reverseResult = true;
                    }

                    const { data, error } = await client.GET('/rest/search3', {
                        params: {
                            query: {
                                albumCount: request.query.limit,
                                albumOffset: offset,
                                artistCount: 0,
                                artistOffset: 0,
                                query: request.query.searchTerm,
                                songCount: 0,
                                songOffset: 0,
                            },
                        },
                        ...options,
                    });

                    if (error) {
                        return errorResponse({ code: 500, message: error });
                    }

                    if (!data['subsonic-response']) {
                        return errorResponse({ code: 404, message: 'No albums found' });
                    }

                    if (data['subsonic-response'].status !== 'ok') {
                        return subsonicErrorResponse(data['subsonic-response'].error);
                    }

                    const result = data['subsonic-response'].searchResult3?.album || [];

                    let items = result.map((album) => normalize.album(album, server));

                    items = helpers.sortBy.album(
                        items,
                        request.query.sortBy,
                        request.query.sortOrder,
                    );

                    if (reverseResult) {
                        items.reverse();
                    }

                    return [
                        null,
                        {
                            items,
                            offset: request.query.offset,
                            totalRecordCount,
                        },
                    ];
                }

                switch (request.query.sortBy) {
                    case AlbumListSortOptions.ALBUM_ARTIST:
                        // Default is ascending
                        if (request.query.sortOrder === ListSortOrder.DESC) {
                            offset = totalRecordCount - request.query.offset - request.query.limit;
                            reverseResult = true;
                        }
                        break;
                    case AlbumListSortOptions.DATE_ADDED:
                        // Default is descending
                        if (request.query.sortOrder === ListSortOrder.DESC) {
                            offset = totalRecordCount - request.query.offset - request.query.limit;
                            reverseResult = true;
                        }
                        break;
                    case AlbumListSortOptions.DATE_PLAYED:
                        // Default is descending
                        if (request.query.sortOrder === ListSortOrder.ASC) {
                            offset = totalRecordCount - request.query.offset - request.query.limit;
                            reverseResult = true;
                        }
                        break;
                    case AlbumListSortOptions.IS_FAVORITE:
                        // Default is ascending
                        if (request.query.sortOrder === ListSortOrder.DESC) {
                            offset = totalRecordCount - request.query.offset - request.query.limit;
                            reverseResult = true;
                        }
                        break;
                    case AlbumListSortOptions.NAME:
                        // Default is ascending
                        if (request.query.sortOrder === ListSortOrder.DESC) {
                            offset = totalRecordCount - request.query.offset - request.query.limit;
                            reverseResult = true;
                        }
                        break;
                    case AlbumListSortOptions.PLAY_COUNT:
                        // Default is descending
                        if (request.query.sortOrder === ListSortOrder.ASC) {
                            offset = totalRecordCount - request.query.offset - request.query.limit;
                            reverseResult = true;
                        }
                        break;
                    case AlbumListSortOptions.RANDOM:
                        break;
                    case AlbumListSortOptions.RATING:
                        // Default is ascending
                        if (request.query.sortOrder === ListSortOrder.DESC) {
                            offset = totalRecordCount - request.query.offset - request.query.limit;
                            reverseResult = true;
                        }
                        break;
                    case AlbumListSortOptions.YEAR:
                        break;
                    default:
                        break;
                }

                const { data, error } = await client.GET('/rest/getAlbumList2', {
                    params: {
                        query: {
                            fromYear,
                            musicFolderId: request.query.musicFolderId,
                            offset: request.query.offset,
                            size: request.query.limit,
                            toYear,
                            type: normalize._sort.album(request.query.sortBy),
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No albums found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const isPartialResult = offset < 0;

                const skip = isPartialResult
                    ? Math.max(offset + Number(request.query.limit), 0)
                    : 0;

                const items = (data['subsonic-response'].albumList2?.album || [])
                    .slice(skip)
                    .map((album) => normalize.album(album, server));

                if (reverseResult) {
                    items.reverse();
                }

                return [
                    null,
                    {
                        items,
                        offset: request.query.offset,
                        totalRecordCount,
                    },
                ];
            },
            getListCount: async (request, options) => {
                async function getPageItemCount(page: number, limit: number): Promise<number> {
                    const { data, error } = await client.GET('/rest/getAlbumList2', {
                        params: {
                            query: {
                                musicFolderId: request.query.musicFolderId,
                                offset: page * limit,
                                size: limit,
                                type: normalize._sort.album(request.query.sortBy),
                            },
                        },
                        ...options,
                    });

                    if (error) {
                        throw new Error(error);
                    }

                    if (!data['subsonic-response']) {
                        throw new Error('No response from server');
                    }

                    if (data['subsonic-response'].status !== 'ok') {
                        throw new Error(data['subsonic-response'].error?.message);
                    }

                    return data['subsonic-response'].albumList2?.album?.length || 0;
                }

                async function getSearchPageItemCount(
                    page: number,
                    limit: number,
                ): Promise<number> {
                    const { data, error } = await client.GET('/rest/search3', {
                        params: {
                            query: {
                                albumCount: limit,
                                albumOffset: page * limit,
                                artistCount: 0,
                                artistOffset: 0,
                                query: request.query.searchTerm || '',
                                songCount: 0,
                                songOffset: 0,
                            },
                        },
                        ...options,
                    });

                    if (error) {
                        throw new Error(error);
                    }

                    if (!data['subsonic-response']) {
                        throw new Error('No response from server');
                    }

                    if (data['subsonic-response'].status !== 'ok') {
                        throw new Error(data['subsonic-response'].error?.message);
                    }

                    return data['subsonic-response'].searchResult3?.album?.length || 0;
                }

                const pageItemCountFn = request.query.searchTerm
                    ? getSearchPageItemCount
                    : getPageItemCount;

                try {
                    const totalRecordCount = await helpers.fetchTotalRecordCount({
                        fetcher: pageItemCountFn,
                        fetchLimit: 500,
                    });

                    return [null, totalRecordCount];
                } catch (error) {
                    return errorResponse({ code: 500, message: error as string });
                }
            },
        },
        albumArtist: {
            getDetail: async (request, options) => {
                const { data, error } = await client.GET('/rest/getArtist', {
                    params: { query: { id: request.query.id } },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No artist found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const artist = data['subsonic-response'].artist;

                return [
                    null,
                    {
                        ...normalize.albumArtist(artist, server),
                        albums: artist.album?.map((album) => normalize.album(album, server)) || [],
                        similarArtists: [],
                    },
                ];
            },
            getList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getArtists', {
                    params: {
                        query: {
                            musicFolderId: request.query.musicFolderId,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No artists found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                let artists: Artist[] = (data['subsonic-response'].artists?.index || [])
                    .flatMap((index) => index)
                    .map((artist) => normalize.albumArtist(artist, server));

                if (request.query.searchTerm) {
                    const searchTerm = request.query.searchTerm;
                    artists = helpers.search(artists, searchTerm, ['name']);
                }

                const sorted = helpers.sortBy.artist(
                    artists,
                    request.query.sortBy,
                    request.query.sortOrder,
                );

                const paginatedResults = helpers.paginate(
                    sorted,
                    request.query.offset,
                    request.query.limit,
                );

                return [null, paginatedResults];
            },
            getListCount: async (request, options) => {
                if (request.totalRecordCount) {
                    return [null, request.totalRecordCount];
                }

                const { data, error } = await client.GET('/rest/getArtists', {
                    params: {
                        query: {
                            musicFolderId: request.query.musicFolderId,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No artists found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                let artists: Artist[] = (data['subsonic-response'].artists?.index || [])
                    .flatMap((index) => index)
                    .map((artist) => normalize.albumArtist(artist, server));

                if (request.query.searchTerm) {
                    const searchTerm = request.query.searchTerm;
                    artists = helpers.search(artists, searchTerm, ['name']);
                }

                return [null, artists.length];
            },
        },
        artist: {
            getList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getArtists', {
                    params: {
                        query: {
                            musicFolderId: request.query.musicFolderId,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No artists found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                let artists = (data['subsonic-response'].artists?.index || [])
                    .flatMap((index) => index)
                    .map((artist) => normalize.albumArtist(artist, server));

                if (request.query.searchTerm) {
                    const searchTerm = request.query.searchTerm;
                    artists = helpers.search(artists, searchTerm, ['name']);
                }

                const sorted = helpers.sortBy.artist(
                    artists,
                    request.query.sortBy,
                    request.query.sortOrder,
                );

                const paginatedResults = helpers.paginate(
                    sorted,
                    request.query.offset,
                    request.query.limit,
                );

                return [null, paginatedResults];
            },
            getListCount: async (request, options) => {
                const { data, error } = await client.GET('/rest/getArtists', {
                    params: { query: { musicFolderId: request.query.musicFolderId } },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No artists found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                let artists: Artist[] = (data['subsonic-response'].artists?.index || [])
                    .flatMap((index) => index)
                    .map((artist) => normalize.albumArtist(artist, server));

                if (request.query.searchTerm) {
                    const searchTerm = request.query.searchTerm;
                    artists = helpers.search(artists, searchTerm, ['name']);
                }

                return [null, artists.length];
            },
        },
        genre: {
            getList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getGenres', {
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No genres found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const results = data['subsonic-response'].genres?.genre || [];
                let genres: Genre[] = results.map((genre) => normalize.genre(genre, server));

                if (request.query.searchTerm) {
                    const searchTerm = request.query.searchTerm;
                    genres = helpers.search(genres, searchTerm, ['name']);
                }

                const sorted = helpers.sortBy.genre(
                    genres,
                    request.query.sortBy,
                    request.query.sortOrder,
                );

                const paginatedResults = helpers.paginate(
                    sorted,
                    request.query.offset,
                    request.query.limit,
                );

                return [null, paginatedResults];
            },
        },
        metadata: {
            addFavorite: async (request, options) => {
                const { data, error } = await client.GET('/rest/star', {
                    params: {
                        query: {
                            albumId:
                                request.query.type === LibraryItem.ALBUM
                                    ? request.query.id
                                    : undefined,
                            artistId:
                                request.query.type === LibraryItem.ALBUM_ARTIST
                                    ? request.query.id
                                    : undefined,
                            id:
                                request.query.type === LibraryItem.SONG
                                    ? request.query.id
                                    : undefined,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to add favorite' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, null];
            },
            removeFavorite: async (request, options) => {
                const { data, error } = await client.GET('/rest/unstar', {
                    params: {
                        query: {
                            albumId:
                                request.query.type === LibraryItem.ALBUM
                                    ? request.query.id
                                    : undefined,
                            artistId:
                                request.query.type === LibraryItem.ALBUM_ARTIST
                                    ? request.query.id
                                    : undefined,
                            id:
                                request.query.type === LibraryItem.SONG
                                    ? request.query.id
                                    : undefined,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to remove favorite' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, null];
            },
            setRating: async (request, options) => {
                const ids = request.query.id;

                for (const id of ids) {
                    const { data, error } = await client.GET('/rest/setRating', {
                        params: {
                            query: {
                                id: id,
                                rating: request.query.rating,
                            },
                        },
                        ...options,
                    });

                    if (error) {
                        return errorResponse({ code: 500, message: error });
                    }

                    if (!data['subsonic-response']) {
                        return errorResponse({ code: 404, message: 'Failed to set rating' });
                    }

                    if (data['subsonic-response'].status !== 'ok') {
                        return subsonicErrorResponse(data['subsonic-response'].error);
                    }
                }

                return [null, null];
            },
        },
        musicFolder: {
            getList: async (_request, options) => {
                const { data, error } = await client.GET('/rest/getMusicFolders', {
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No music folders found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const folders = data['subsonic-response'].musicFolders?.musicFolder || [];

                return [
                    null,
                    {
                        items: folders.map((folder) => ({
                            id: folder.id.toString(),
                            name: folder.name || '',
                        })),
                        offset: 0,
                        totalRecordCount: folders.length,
                    },
                ];
            },
        },
        playlist: {
            addTo: async (request, options) => {
                const { data, error } = await client.GET('/rest/updatePlaylist', {
                    params: {
                        query: {
                            playlistId: request.query.id,
                            songIdToAdd: request.body.songId,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to add to playlist' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, null];
            },
            create: async (request, options) => {
                const { data, error } = await client.GET('/rest/createPlaylist', {
                    params: {
                        query: {
                            name: request.body.name,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to create playlist' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [
                    null,
                    {
                        id: data['subsonic-response'].playlist?.id?.toString() || '',
                        name: request.body.name,
                    },
                ];
            },
            delete: async (request, options) => {
                const { data, error } = await client.GET('/rest/deletePlaylist', {
                    params: {
                        query: {
                            id: request.query.id,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to delete playlist' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, null];
            },
            getDetail: async (request, options) => {
                const { data, error } = await client.GET('/rest/getPlaylist', {
                    params: {
                        query: {
                            id: request.query.id,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No playlist found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, normalize.playlist(data['subsonic-response'].playlist, server)];
            },
            getList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getPlaylists', {
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No playlists found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const results = data['subsonic-response'].playlists?.playlist || [];

                const items = results.map((playlist) => normalize.playlist(playlist, server));

                const sorted = helpers.sortBy.playlist(
                    items,
                    request.query.sortBy,
                    request.query.sortOrder,
                );

                const paginatedResults = helpers.paginate(
                    sorted,
                    request.query.offset,
                    request.query.limit,
                );

                return [null, paginatedResults];
            },
            getListCount: async (request, options) => {
                if (request.totalRecordCount) {
                    return [null, request.totalRecordCount];
                }

                const { data, error } = await client.GET('/rest/getPlaylists', {
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No playlists found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const playlists = data['subsonic-response'].playlists?.playlist || [];

                return [null, playlists.length];
            },
            getSongList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getPlaylist', {
                    params: {
                        query: {
                            id: request.query.id,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No playlist found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const songs = data['subsonic-response'].playlist?.entry || [];

                const items = songs.map((song) => normalize.song(song, server));

                const sorted = helpers.sortBy.song(
                    items,
                    request.query.sortBy,
                    request.query.sortOrder,
                );

                const paginatedResults = helpers.paginate(
                    sorted,
                    request.query.offset,
                    request.query.limit,
                );

                return [null, paginatedResults];
            },
            removeFrom: async (request, options) => {
                const { data, error } = await client.GET('/rest/updatePlaylist', {
                    params: {
                        query: {
                            playlistId: request.query.id,
                            songIndexToRemove: request.query.songId.map((id) => parseInt(id)),
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to remove from playlist' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, null];
            },
            update: async (request, options) => {
                const { data, error } = await client.GET('/rest/updatePlaylist', {
                    params: {
                        query: {
                            comment: request.body.comment,
                            name: request.body.name,
                            playlistId: request.query.id,
                            public: request.body.public,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to update playlist' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, null];
            },
        },
        server: {
            getServerInfo: async (_request, options) => {
                const { data, error } = await client.GET('/rest/ping', {
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to get server info' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [
                    null,
                    {
                        features: {},
                        id: server?.id,
                        version: data['subsonic-response'].version || 'unknown',
                    },
                ];
            },
            getTranscodingUrl: async (request) => {
                let url = request.query.base;
                if (request.query.format) {
                    url += `&format=${request.query.format}`;
                }
                if (request.query.bitrate !== undefined) {
                    url += `&maxBitRate=${request.query.bitrate}`;
                }
                return [null, url];
            },
            getType: () => ServerType.SUBSONIC,
            scrobble: async (request, options) => {
                const { data, error } = await client.GET('/rest/scrobble', {
                    params: {
                        query: {
                            id: request.query.id,
                            submission: request.query.submission,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to scrobble' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, null];
            },
            search: async (request, options) => {
                const { data, error } = await client.GET('/rest/search3', {
                    params: {
                        query: {
                            albumCount: request.query.albumLimit,
                            albumOffset: request.query.albumStartIndex,
                            artistCount: request.query.albumArtistLimit,
                            artistOffset: request.query.albumArtistStartIndex,
                            query: request.query.query || '',
                            songCount: request.query.songLimit,
                            songOffset: request.query.songStartIndex,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No search results found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const searchResult = data['subsonic-response'].searchResult3;
                return [
                    null,
                    {
                        albumArtists: (searchResult?.artist || []).map((artist) =>
                            normalize.albumArtist(artist, server),
                        ),
                        albums: (searchResult?.album || []).map((album) =>
                            normalize.album(album, server),
                        ),
                        songs: (searchResult?.song || []).map((song) =>
                            normalize.song(song, server),
                        ),
                    },
                ];
            },
        },
        song: {
            getDetail: async (request, options) => {
                const { data, error } = await client.GET('/rest/getSong', {
                    params: {
                        query: {
                            id: request.query.id,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No song found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, normalize.song(data['subsonic-response'].song, server)];
            },
            getList: async (request, options) => {
                const { data, error } = await client.GET('/rest/search3', {
                    params: {
                        query: {
                            albumCount: 0,
                            albumOffset: 0,
                            artistCount: 0,
                            artistOffset: 0,
                            query: request.query.searchTerm || '',
                            songCount: request.query.limit,
                            songOffset: request.query.offset,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No songs found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const songs = data['subsonic-response'].searchResult3?.song || [];
                return [
                    null,
                    {
                        items: songs.map((song) => normalize.song(song, server)),
                        offset: request.query.offset,
                        totalRecordCount: null,
                    },
                ];
            },
            getListCount: async (request, options) => {
                const sanitizedQuery = {
                    folderId: request.query.musicFolderId,
                    genreId: request.query.genreIds,
                    searchTerm: request.query.searchTerm,
                };

                const getPageItemCount = async (page: number, limit: number): Promise<number> => {
                    const { data, error } = await client.GET('/rest/search3', {
                        params: {
                            query: {
                                musicFolderId: sanitizedQuery.folderId,
                                query: sanitizedQuery.searchTerm || '',
                                songCount: limit,
                                songOffset: page * limit,
                            },
                        },
                        ...options,
                    });

                    if (error) {
                        throw new Error(error);
                    }

                    if (!data['subsonic-response']) {
                        throw new Error('No songs found');
                    }

                    if (data['subsonic-response'].status !== 'ok') {
                        throw new Error((data['subsonic-response'] as any).error);
                    }

                    const songs = data['subsonic-response'].searchResult3?.song || [];
                    return songs.length;
                };

                const getPageItemCountWithGenre = async (
                    page: number,
                    limit: number,
                ): Promise<number> => {
                    const { data, error } = await client.GET('/rest/getSongsByGenre', {
                        params: {
                            query: {
                                genre: sanitizedQuery.genreId?.[0] || '',
                                musicFolderId: sanitizedQuery.folderId,
                                songCount: limit,
                                songOffset: page * limit,
                            },
                        },
                        ...options,
                    });

                    if (error) {
                        throw new Error(error);
                    }

                    if (!data['subsonic-response']) {
                        throw new Error('No songs found');
                    }

                    if (data['subsonic-response'].status !== 'ok') {
                        throw new Error((data['subsonic-response'] as any).error);
                    }

                    const songs = data['subsonic-response'].songsByGenre?.song || [];
                    return songs.length;
                };

                try {
                    const fetcherFn = sanitizedQuery.genreId
                        ? getPageItemCountWithGenre
                        : getPageItemCount;

                    const totalRecordCount = await helpers.getListCount(
                        {
                            expiration: 1440,
                            query: sanitizedQuery,
                            serverId: server.id,
                            type: LibraryItem.SONG,
                        },
                        fetcherFn,
                    );

                    return [null, totalRecordCount as number];
                } catch (err) {
                    return [{ code: 500, message: err as string }, null];
                }
            },
            getRandomList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getRandomSongs', {
                    params: {
                        query: {
                            fromYear: request.query.minYear,
                            genre: request.query.genre,
                            musicFolderId: request.query.musicFolderId,
                            size: request.query.limit,
                            toYear: request.query.maxYear,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No random songs found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const songs = data['subsonic-response'].randomSongs?.song || [];
                return [
                    null,
                    {
                        items: songs.map((song) => normalize.song(song, server)),
                        offset: 0,
                        totalRecordCount: songs.length,
                    },
                ];
            },
            getSimilar: async (request, options) => {
                const { data, error } = await client.GET('/rest/getSimilarSongs', {
                    params: {
                        query: {
                            count: request.query.count,
                            id: request.query.songId,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No similar songs found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const songs = data['subsonic-response'].similarSongs?.song || [];
                return [null, songs.map((song) => normalize.song(song, server))];
            },
            getStructuredLyrics: async (request, options) => {
                const { data, error } = await client.GET('/rest/getLyricsBySongId', {
                    params: {
                        query: {
                            id: request.query.songId,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data || !data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No structured lyrics found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const lyrics = data['subsonic-response'].lyricsList?.structuredLyrics;

                if (!lyrics) {
                    return [null, []];
                }

                return [
                    null,
                    lyrics.map((lyric) => {
                        const baseLyric = {
                            artist: lyric.displayArtist || '',
                            lang: lyric.lang,
                            name: lyric.displayTitle || '',
                            remote: false,
                            source: server?.name || 'music server',
                        };

                        if (lyric.synced) {
                            return {
                                ...baseLyric,
                                lyrics: lyric.line.map((line) => [line.start!, line.value]),
                                synced: true,
                            };
                        }
                        return {
                            ...baseLyric,
                            lyrics: lyric.line.map((line) => [line.value]).join('\n'),
                            synced: false,
                        };
                    }),
                ];
            },
            getTopList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getTopSongs', {
                    params: {
                        query: {
                            count: request.query.limit,
                            id: request.query.artistId,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No top songs found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const songs = data['subsonic-response'].topSongs?.song || [];
                return [
                    null,
                    {
                        items: songs.map((song) => normalize.song(song, server)),
                        offset: 0,
                        totalRecordCount: songs.length,
                    },
                ];
            },
        },
        user: {
            getList: async (request, options) => {
                const { data, error } = await client.GET('/rest/getUsers', {
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No users found' });
                }

                const results =
                    ((data['subsonic-response'] as any).users as components['schemas']['Users'])
                        .user || [];

                let items = results.map((user) => normalize.user(user, server));

                if (request.query.searchTerm) {
                    items = helpers.search(items, request.query.searchTerm, ['username']);
                }

                const sorted = helpers.sortBy.user(
                    items,
                    request.query.sortBy,
                    request.query.sortOrder,
                );

                const paginatedResults = helpers.paginate(
                    sorted,
                    request.query.offset,
                    request.query.limit,
                );

                return [null, paginatedResults];
            },
            getListCount: async (request, options) => {
                if (request.totalRecordCount) {
                    return [null, request.totalRecordCount];
                }

                const { data, error } = await client.GET('/rest/getUsers', {
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'No users found' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                return [null, data['subsonic-response'].users?.user?.length || 0];
            },
            shareItem: async (request, options) => {
                const { data, error } = await client.GET('/rest/createShare', {
                    params: {
                        query: {
                            description: request.body.description,
                            expires: request.body.expires,
                            id: request.body.resourceIds,
                            resourceType: request.body.resourceType,
                        },
                    },
                    ...options,
                });

                if (error) {
                    return errorResponse({ code: 500, message: error });
                }

                if (!data['subsonic-response']) {
                    return errorResponse({ code: 404, message: 'Failed to create share' });
                }

                if (data['subsonic-response'].status !== 'ok') {
                    return subsonicErrorResponse(data['subsonic-response'].error);
                }

                const share = data['subsonic-response'].shares?.share?.[0];

                if (!share) {
                    return errorResponse({ code: 404, message: 'Failed to create share' });
                }

                return [null, { id: share.id, url: share.url }];
            },
        },
    };
};
