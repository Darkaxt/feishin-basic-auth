import { orderBy } from 'lodash';
import { z } from 'zod';

import i18n from '/@/i18n/i18n';
import { JFAlbumArtistListSort, JFArtistListSort } from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import { NDAlbumArtistListSort } from '/@/shared/api/navidrome.types';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import { BasePaginatedResponse, BaseQuery } from '/@/shared/types/adapter/api-controller-types';
import { RelatedGenre } from '/@/shared/types/domain/genre-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem, ListSortOrder } from '/@/shared/types/domain/shared-domain-types';

export enum ArtistListSortOptions {
    ALBUM_COUNT = 'albumCount',
    DURATION = 'duration',
    IS_FAVORITE = 'isFavorite',
    NAME = 'name',
    RANDOM = 'random',
    RATING = 'rating',
    TRACK_COUNT = 'trackCount',
}

export const ArtistListSortOptionsLabels = {
    [ArtistListSortOptions.ALBUM_COUNT]: i18n.t('filter.albumCount'),
    [ArtistListSortOptions.DURATION]: i18n.t('filter.duration'),
    [ArtistListSortOptions.IS_FAVORITE]: i18n.t('filter.isFavorite'),
    [ArtistListSortOptions.NAME]: i18n.t('filter.name'),
    [ArtistListSortOptions.RANDOM]: i18n.t('filter.random'),
    [ArtistListSortOptions.RATING]: i18n.t('filter.rating'),
    [ArtistListSortOptions.TRACK_COUNT]: i18n.t('filter.trackCount'),
};

export type Artist = {
    _serverId: string;
    _serverType: ServerType;
    albumCount: null | number;
    biography: null | string;
    duration: null | number;
    genres: RelatedGenre[];
    id: string;
    imageUrl: null | string;
    itemType: LibraryItem.ALBUM_ARTIST;
    mbzId: null | string;
    name: string;
    playCount: null | number;
    similarArtists: null | RelatedArtist[];
    songCount: null | number;
    userFavorite: boolean;
    userLastPlayedDate: null | string;
    userRating: null | number;
};

export type RelatedArtist = {
    id: string;
    imageUrl: null | string;
    name: string;
};

type AlbumArtistListSortMap = {
    jellyfin: Record<AlbumArtistListSort, JFAlbumArtistListSort | undefined>;
    navidrome: Record<AlbumArtistListSort, NDAlbumArtistListSort | undefined>;
    subsonic: Record<AlbumArtistListSort, undefined>;
};

export const albumArtistListSortMap: AlbumArtistListSortMap = {
    jellyfin: {
        album: JFAlbumArtistListSort.ALBUM,
        albumCount: undefined,
        duration: JFAlbumArtistListSort.DURATION,
        favorited: undefined,
        name: JFAlbumArtistListSort.NAME,
        playCount: undefined,
        random: JFAlbumArtistListSort.RANDOM,
        rating: undefined,
        recentlyAdded: JFAlbumArtistListSort.RECENTLY_ADDED,
        releaseDate: undefined,
        songCount: undefined,
    },
    navidrome: {
        album: undefined,
        albumCount: NDAlbumArtistListSort.ALBUM_COUNT,
        duration: undefined,
        favorited: NDAlbumArtistListSort.FAVORITED,
        name: NDAlbumArtistListSort.NAME,
        playCount: NDAlbumArtistListSort.PLAY_COUNT,
        random: undefined,
        rating: NDAlbumArtistListSort.RATING,
        recentlyAdded: undefined,
        releaseDate: undefined,
        songCount: NDAlbumArtistListSort.SONG_COUNT,
    },
    subsonic: {
        album: undefined,
        albumCount: undefined,
        duration: undefined,
        favorited: undefined,
        name: undefined,
        playCount: undefined,
        random: undefined,
        rating: undefined,
        recentlyAdded: undefined,
        releaseDate: undefined,
        songCount: undefined,
    },
};

export enum ArtistListSort {
    ALBUM = 'album',
    ALBUM_COUNT = 'albumCount',
    DURATION = 'duration',
    FAVORITED = 'favorited',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'recentlyAdded',
    RELEASE_DATE = 'releaseDate',
    SONG_COUNT = 'songCount',
}

export type AlbumArtistDetailQuery = { id: string };

export type AlbumArtistDetailRequest = { query: AlbumArtistDetailQuery };

export type AlbumArtistDetailResponse = Artist | null;

export interface ArtistListQuery extends BaseQuery<ArtistListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.albumArtistList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.albumArtistList>>;
    };
    limit?: number;
    musicFolderId?: string;
    role?: string;
    searchTerm?: string;
    startIndex: number;
}

export type ArtistListRequest = { query: ArtistListQuery };

export type ArtistListResponse = BasePaginatedResponse<Artist[]> | null | undefined;
type ArtistListSortMap = {
    jellyfin: Record<ArtistListSort, JFArtistListSort | undefined>;
    navidrome: Record<ArtistListSort, undefined>;
    subsonic: Record<ArtistListSort, undefined>;
};

export const artistListSortMap: ArtistListSortMap = {
    jellyfin: {
        album: JFArtistListSort.ALBUM,
        albumCount: undefined,
        duration: JFArtistListSort.DURATION,
        favorited: undefined,
        name: JFArtistListSort.NAME,
        playCount: undefined,
        random: JFArtistListSort.RANDOM,
        rating: undefined,
        recentlyAdded: JFArtistListSort.RECENTLY_ADDED,
        releaseDate: undefined,
        songCount: undefined,
    },
    navidrome: {
        album: undefined,
        albumCount: undefined,
        duration: undefined,
        favorited: undefined,
        name: undefined,
        playCount: undefined,
        random: undefined,
        rating: undefined,
        recentlyAdded: undefined,
        releaseDate: undefined,
        songCount: undefined,
    },
    subsonic: {
        album: undefined,
        albumCount: undefined,
        duration: undefined,
        favorited: undefined,
        name: undefined,
        playCount: undefined,
        random: undefined,
        rating: undefined,
        recentlyAdded: undefined,
        releaseDate: undefined,
        songCount: undefined,
    },
};
export enum AlbumArtistListSort {
    ALBUM = 'album',
    ALBUM_COUNT = 'albumCount',
    DURATION = 'duration',
    FAVORITED = 'favorited',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'recentlyAdded',
    RELEASE_DATE = 'releaseDate',
    SONG_COUNT = 'songCount',
}

export interface AlbumArtistListQuery extends BaseQuery<AlbumArtistListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.albumArtistList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.albumArtistList>>;
    };
    limit?: number;
    musicFolderId?: string;
    searchTerm?: string;
    startIndex: number;
}

export type AlbumArtistListRequest = { query: AlbumArtistListQuery };

export type AlbumArtistListResponse = BasePaginatedResponse<Artist[]> | null | undefined;

export type ArtistInfoQuery = {
    artistId: string;
    limit: number;
    musicFolderId?: string;
};

export type ArtistInfoRequest = { query: ArtistInfoQuery };

export const sortAlbumArtistList = (
    artists: Artist[],
    sortBy: AlbumArtistListSort | ArtistListSort,
    sortOrder: ListSortOrder,
) => {
    const order = sortOrder === ListSortOrder.ASC ? 'asc' : 'desc';

    let results = artists;

    switch (sortBy) {
        case AlbumArtistListSort.ALBUM_COUNT:
            results = orderBy(artists, ['albumCount', (v) => v.name.toLowerCase()], [order, 'asc']);
            break;

        case AlbumArtistListSort.FAVORITED:
            results = orderBy(artists, ['starred'], [order]);
            break;

        case AlbumArtistListSort.NAME:
            results = orderBy(artists, [(v) => v.name.toLowerCase()], [order]);
            break;

        case AlbumArtistListSort.RATING:
            results = orderBy(artists, ['userRating'], [order]);
            break;

        default:
            break;
    }

    return results;
};
