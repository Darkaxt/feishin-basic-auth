import { AxiosHeaders } from 'axios';
import dayjs from 'dayjs';
import isElectron from 'is-electron';
import { orderBy, shuffle } from 'lodash';
import semverCoerce from 'semver/functions/coerce';
import semverGte from 'semver/functions/gte';
import { z } from 'zod';

import { Album, AlbumListSortOptions } from '/@/shared/types/domain/album-domain-types';
import { Artist, ArtistListSortOptions } from '/@/shared/types/domain/artist-domain-types';
import { Genre, GenreListSortOptions } from '/@/shared/types/domain/genre-domain-types';
import {
    Playlist,
    PlaylistListSortOptions,
    PlaylistSong,
} from '/@/shared/types/domain/playlist-domain-types';
import { ServerFeature, ServerListItem } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem, ListSortOrder } from '/@/shared/types/domain/shared-domain-types';
import { Song, SongListSortOptions } from '/@/shared/types/domain/song-domain-types';
import { User, UserListSortOptions } from '/@/shared/types/domain/user-domain-types';

// Since ts-rest client returns a strict response type, we need to add the headers to the body object
export const resultWithHeaders = <ItemType extends z.ZodTypeAny>(itemSchema: ItemType) => {
    return z.object({
        data: itemSchema,
        headers: z.instanceof(AxiosHeaders),
    });
};

export const resultSubsonicBaseResponse = <ItemType extends z.ZodRawShape>(
    itemSchema: ItemType,
) => {
    return z.object({
        'subsonic-response': z
            .object({
                status: z.string(),
                version: z.string(),
            })
            .extend(itemSchema),
    });
};

export const hasFeature = (server: null | ServerListItem, feature: ServerFeature): boolean => {
    if (!server || !server.features) {
        return false;
    }

    return (server.features[feature]?.length || 0) > 0;
};

export type VersionInfo = ReadonlyArray<[string, Record<string, readonly number[]>]>;

/**
 * Returns the available server features given the version string.
 * @param versionInfo a list, in DECREASING VERSION order, of the features supported by the server.
 *  The first version match will automatically consider the rest matched.
 * @example
 * ```
 * // The CORRECT way to order
 * const VERSION_INFO: VersionInfo = [
 *   ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
 *   ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
 * ];
 * // INCORRECT way to order
 * const VERSION_INFO: VersionInfo = [
 *   ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
 *   ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
 * ];
 *  ```
 * @param version the version string (SemVer)
 * @returns a Record containing the matched features (if any) and their versions
 */
export const getFeatures = (
    versionInfo: VersionInfo,
    version: string,
): Record<string, number[]> => {
    const cleanVersion = semverCoerce(version);
    const features: Record<string, number[]> = {};
    let matched = cleanVersion === null;

    for (const [version, supportedFeatures] of versionInfo) {
        if (!matched) {
            matched = semverGte(cleanVersion!, version);
        }

        if (matched) {
            for (const [feature, feat] of Object.entries(supportedFeatures)) {
                if (feature in features) {
                    features[feature].push(...feat);
                } else {
                    features[feature] = [...feat];
                }
            }
        }
    }

    return features;
};

export const getClientType = (): string => {
    if (isElectron()) {
        return 'Desktop Client';
    }
    const agent = navigator.userAgent;
    switch (true) {
        case agent.toLowerCase().indexOf('edge') > -1:
            return 'Microsoft Edge';
        case agent.toLowerCase().indexOf('edg/') > -1:
            return 'Edge Chromium'; // Match also / to avoid matching for the older Edge
        case agent.toLowerCase().indexOf('opr') > -1:
            return 'Opera';
        case agent.toLowerCase().indexOf('chrome') > -1:
            return 'Chrome';
        case agent.toLowerCase().indexOf('trident') > -1:
            return 'Internet Explorer';
        case agent.toLowerCase().indexOf('firefox') > -1:
            return 'Firefox';
        case agent.toLowerCase().indexOf('safari') > -1:
            return 'Safari';
        default:
            return 'PC';
    }
};

export const SEPARATOR_STRING = ' · ';

export async function estimateTotalRecordCount(args: {
    fetcher: (page: number, limit: number) => Promise<number>;
    limit: number;
}) {
    const { fetcher, limit } = args;

    // Recursive binary search across all pages to estimate total rows
    async function estimateTotalRowsRecursive(
        low: number,
        high: number,
        limit: number,
    ): Promise<number> {
        if (low > high) {
            return 0; // This condition is just a safeguard and shouldn't be reached
        }

        const mid = Math.floor((low + high) / 2);
        const data = await fetcher(mid, limit);

        if (data < limit) {
            // If the current page contains fewer than 500 items, it's close to the last page
            const itemCount = (mid - 1) * limit + data;
            return itemCount;
        } else {
            // If the current page is full, search in the higher half
            return estimateTotalRowsRecursive(mid + 1, high, limit);
        }
    }

    // Function to estimate total rows with limited page size
    async function estimateTotalRows(): Promise<number> {
        let low = 1;
        let high = 2;

        // Step 1: Exponentially grow the number of pages to get an upper bound for the total pages

        while (true) {
            const data = await fetcher(high, limit);

            if (data < limit) {
                // If we encounter the last page, break out of the loop
                break;
            }

            // Double the upper bound for the number of pages
            low = high;
            high *= 2;
        }

        // Step 2: Perform binary search across all pages to find the exact number of rows
        return estimateTotalRowsRecursive(low, high, limit);
    }

    return estimateTotalRows();
}

export async function exactTotalRecordCount(args: {
    fetcher: (page: number, limit: number) => Promise<number>;
    limit: number;
    startPage: number;
}) {
    const { fetcher, limit, startPage } = args;

    // Add early return for page 1 with no results
    if (startPage === 1) {
        const firstPageCount = await fetcher(1, limit);
        if (firstPageCount === 0) {
            return 0;
        }
    }

    const fetchCountRecursive = async (
        page: number,
        limit: number,
        reverse: boolean,
        totalRecordCount: number,
        previousPageRecordCount?: number,
    ): Promise<number> => {
        // Add guard against negative page numbers
        if (page < 1) {
            return totalRecordCount;
        }

        const currentPageRecordCount = await fetcher(page, limit);

        if (currentPageRecordCount !== limit && currentPageRecordCount !== 0) {
            totalRecordCount += currentPageRecordCount;
            return totalRecordCount;
        }

        // Handle the case when the last page is equal to the limit and is ascending
        if (
            !reverse &&
            currentPageRecordCount !== limit &&
            currentPageRecordCount === 0 &&
            currentPageRecordCount === previousPageRecordCount
        ) {
            return totalRecordCount;
        }

        if (reverse) {
            totalRecordCount -= limit;
            return fetchCountRecursive(
                page - 1,
                limit,
                true,
                totalRecordCount,
                currentPageRecordCount,
            );
        } else {
            totalRecordCount += currentPageRecordCount;
            return fetchCountRecursive(
                page + 1,
                limit,
                false,
                totalRecordCount,
                currentPageRecordCount,
            );
        }
    };

    const estimatedStartRecordCount = startPage * limit;
    const startPageRecordCount = await fetcher(startPage, limit);
    const isLastPage = startPageRecordCount < limit && startPageRecordCount !== 0;

    if (isLastPage) {
        if (estimatedStartRecordCount < limit) {
            return estimatedStartRecordCount + startPageRecordCount;
        }

        return estimatedStartRecordCount - limit + startPageRecordCount;
    }

    const shouldReverse = startPageRecordCount < limit;

    const count = await fetchCountRecursive(
        startPage,
        limit,
        shouldReverse,
        estimatedStartRecordCount,
    );
    return count;
}

export async function fetchAllRecords<T>(args: {
    fetcher: (page: number, limit: number) => Promise<T[]>;
    fetchLimit?: number;
    items?: T[];
    page?: number;
}) {
    const limit = args.fetchLimit || 500;
    const page = args.page || 0;
    const items = args.items || [];

    const result = await args.fetcher(page, limit);

    // If we get an empty array, we've reached the end
    if (result.length === 0) {
        return items;
    }

    // If we get less than the limit, we've reached the end
    if (result.length < limit) {
        return [...result, ...items];
    }

    return fetchAllRecords({
        fetcher: args.fetcher,
        fetchLimit: args.fetchLimit,
        items: [...items, ...result],
        page: page + 1,
    });
}

export async function fetchTotalRecordCount(args: {
    fetcher: (page: number, limit: number) => Promise<number>;
    fetchLimit?: number;
}) {
    const limit = args.fetchLimit || 500;

    const estimatedCount = await estimateTotalRecordCount({
        fetcher: args.fetcher,
        limit,
    });
    const estimatedPages = Math.ceil(estimatedCount / limit);
    const totalRecordCount = await exactTotalRecordCount({
        fetcher: args.fetcher,
        limit,
        startPage: estimatedPages,
    });
    return totalRecordCount;
}

function paginate<T>(array: T[], offset: number, limit: number) {
    let result: T[];

    if (limit === -1) {
        result = array.slice(offset);
    } else {
        result = array.slice(offset, offset + limit);
    }

    return {
        items: result,
        offset,
        totalRecordCount: array.length,
    };
}

function search<T>(array: T[], searchTerm: string, keys: (keyof T)[]) {
    return array.filter((item) =>
        keys.some((key) => {
            const value = item[key];
            return String(value ?? '')
                .toLocaleLowerCase()
                .includes(searchTerm.toLocaleLowerCase());
        }),
    );
}

const counts = new Map<string, { count: number; expires: number }>();

setInterval(
    () => {
        counts.forEach((value, key) => {
            if (value.expires < dayjs().unix()) {
                counts.delete(key);
            }
        });
    },
    1000 * 60 * 10,
); // 10 minutes

async function getListCount(
    options: {
        expiration?: number; // Expiration in minutes
        fetchLimit?: number;
        query: Record<string, unknown>;
        serverId: string;
        type: LibraryItem | string;
    },
    fetcher?: (page: number, limit: number) => Promise<number>,
) {
    const key = getListCountKey(options);
    const value = counts.get(key);

    if (fetcher && (!value || value.expires < dayjs().unix())) {
        const totalRecordCount = await fetchTotalRecordCount({
            fetcher,
            fetchLimit: options.fetchLimit,
        });
        setListCount(key, totalRecordCount, options.expiration ?? 1440);
        return totalRecordCount;
    }

    return value?.count;
}

function getListCountKey(options: {
    query: Record<string, unknown>;
    serverId: string;
    type: LibraryItem | string;
}) {
    const hash = JSON.stringify(options.query as Record<string, boolean | null | number | string>);
    return `${options.serverId}::${options.type}::${hash}`;
}

function invalidateListCount(key?: string) {
    if (key) {
        return counts.delete(key);
    }

    return counts.clear();
}

function setListCount(key: string, count: number, expiration = 1440) {
    counts.set(key, { count, expires: dayjs().unix() + expiration * 1000 * 60 });
}

const sortBy = {
    album: (array: Album[], key: AlbumListSortOptions, order: ListSortOrder) => {
        let value = array;

        switch (key) {
            case AlbumListSortOptions.ALBUM_ARTIST: {
                value = orderBy(value, ['artistId'], [order]);
                break;
            }
            case AlbumListSortOptions.ARTIST: {
                value = orderBy(value, ['artistId'], [order]);
                break;
            }
            case AlbumListSortOptions.COMMUNITY_RATING: {
                value = orderBy(value, ['userRating'], [order]);
                break;
            }
            case AlbumListSortOptions.CRITIC_RATING: {
                value = orderBy(value, ['userRating'], [order]);
                break;
            }
            case AlbumListSortOptions.DATE_ADDED: {
                value = orderBy(value, ['createdDate'], [order]);
                break;
            }
            case AlbumListSortOptions.DATE_PLAYED: {
                value = orderBy(value, ['userLastPlayedDate'], [order]);
                break;
            }
            case AlbumListSortOptions.DURATION: {
                value = orderBy(value, ['duration'], [order]);
                break;
            }
            case AlbumListSortOptions.IS_FAVORITE: {
                value = orderBy(value, ['userFavoriteDate', 'userFavorite'], [order, order]);
                break;
            }
            case AlbumListSortOptions.NAME: {
                value = orderBy(value, ['name'], [order]);
                break;
            }
            case AlbumListSortOptions.PLAY_COUNT: {
                value = orderBy(value, ['userPlayCount'], [order]);
                break;
            }
            case AlbumListSortOptions.RANDOM: {
                value = shuffle(value);
                break;
            }
            case AlbumListSortOptions.RELEASE_DATE: {
                value = orderBy(value, ['releaseDate'], [order]);
                break;
            }
            case AlbumListSortOptions.TRACK_COUNT: {
                value = orderBy(value, ['trackCount'], [order]);
                break;
            }
            case AlbumListSortOptions.YEAR: {
                value = orderBy(value, ['releaseYear'], [order]);
                break;
            }
        }

        return value;
    },
    artist: (array: Artist[], key: ArtistListSortOptions, order: ListSortOrder) => {
        let value = array;

        switch (key) {
            case ArtistListSortOptions.ALBUM_COUNT: {
                value = orderBy(value, ['albumCount'], [order]);
                break;
            }
            case ArtistListSortOptions.NAME: {
                value = orderBy(value, ['name'], [order]);
                break;
            }
            case ArtistListSortOptions.TRACK_COUNT: {
                value = orderBy(value, ['trackCount'], [order]);
                break;
            }
        }

        return value;
    },
    genre: (array: Genre[], key: GenreListSortOptions, order: ListSortOrder) => {
        let value = array;

        switch (key) {
            case GenreListSortOptions.ALBUM_COUNT: {
                value = orderBy(value, ['albumCount'], [order]);
                break;
            }
            case GenreListSortOptions.NAME: {
                value = orderBy(value, ['name'], [order]);
                break;
            }
            case GenreListSortOptions.TRACK_COUNT: {
                value = orderBy(value, ['trackCount'], [order]);
                break;
            }
        }

        return value;
    },
    playlist: (array: Playlist[], key: PlaylistListSortOptions, order: ListSortOrder) => {
        let value = array;

        switch (key) {
            case PlaylistListSortOptions.DURATION: {
                value = orderBy(value, ['duration'], [order]);
                break;
            }
            case PlaylistListSortOptions.NAME: {
                value = orderBy(value, ['name'], [order]);
                break;
            }
            case PlaylistListSortOptions.OWNER: {
                value = orderBy(value, ['owner'], [order]);
                break;
            }
            case PlaylistListSortOptions.PUBLIC: {
                value = orderBy(value, ['isPublic'], [order]);
                break;
            }
            case PlaylistListSortOptions.TRACK_COUNT: {
                value = orderBy(value, ['trackCount'], [order]);
                break;
            }
        }

        return value;
    },
    song: (array: PlaylistSong[] | Song[], key: SongListSortOptions, order: ListSortOrder) => {
        let value = array;

        switch (key) {
            case SongListSortOptions.ALBUM: {
                value = orderBy(value, ['album'], [order]);
                break;
            }
            case SongListSortOptions.ALBUM_ARTIST: {
                value = orderBy(value, ['artistId'], [order]);
                break;
            }
            case SongListSortOptions.ARTIST: {
                value = orderBy(value, ['artistId'], [order]);
                break;
            }
            case SongListSortOptions.BPM: {
                value = orderBy(value, ['bpm'], [order]);
                break;
            }
            case SongListSortOptions.CHANNELS: {
                value = orderBy(value, ['channels'], [order]);
                break;
            }
            case SongListSortOptions.COMMENT: {
                value = orderBy(value, ['comment'], [order]);
                break;
            }
            case SongListSortOptions.DURATION: {
                value = orderBy(value, ['duration'], [order]);
                break;
            }
            case SongListSortOptions.GENRE: {
                value = orderBy(value, ['genre'], [order]);
                break;
            }
            case SongListSortOptions.ID: {
                break;
            }
            case SongListSortOptions.IS_FAVORITE: {
                value = orderBy(value, ['userFavoriteDate', 'userFavorite'], [order, order]);
                break;
            }
            case SongListSortOptions.NAME: {
                value = orderBy(value, ['name'], [order]);
                break;
            }
            case SongListSortOptions.PLAY_COUNT: {
                value = orderBy(value, ['userPlayCount'], [order]);
                break;
            }
            case SongListSortOptions.RANDOM: {
                value = shuffle(value);
                break;
            }
            case SongListSortOptions.RATING: {
                value = orderBy(value, ['userRating'], [order]);
                break;
            }
            case SongListSortOptions.RECENTLY_ADDED: {
                value = orderBy(value, ['recentlyAdded'], [order]);
                break;
            }
            case SongListSortOptions.RECENTLY_PLAYED: {
                value = orderBy(value, ['userLastPlayedDate'], [order]);
                break;
            }
            case SongListSortOptions.RELEASE_DATE: {
                value = orderBy(value, ['releaseYear'], [order]);
                break;
            }
            case SongListSortOptions.YEAR: {
                value = orderBy(value, ['releaseYear'], [order]);
                break;
            }
        }

        return value;
    },
    user: (array: User[], key: UserListSortOptions, order: ListSortOrder) => {
        let value = array;

        switch (key) {
            case UserListSortOptions.NAME: {
                value = orderBy(value, ['name'], [order]);
                break;
            }
        }

        return value;
    },
};

export const helpers = {
    estimateTotalRecordCount,
    exactTotalRecordCount,
    fetchAllRecords,
    fetchTotalRecordCount,
    getListCount,
    getListCountKey,
    invalidateListCount,
    paginate,
    search,
    setListCount,
    sortBy,
};
