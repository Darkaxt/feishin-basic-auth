import i18n from 'src/i18n/i18n';
import { z } from 'zod';

import { JFAlbumArtistListSort, JFArtistListSort } from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import { NDAlbumArtistListSort } from '/@/shared/api/navidrome.types';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import {
    BaseEndpointArgs,
    BasePaginatedResponse,
    BaseQuery,
    LibraryItem,
} from '/@/shared/types/domain-types';
import { Genre } from '/@/shared/types/domain/genre-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';

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

export type AlbumArtist = {
    albumCount: null | number;
    backgroundImageUrl: null | string;
    biography: null | string;
    duration: null | number;
    genres: Genre[];
    id: string;
    imageUrl: null | string;
    itemType: LibraryItem.ALBUM_ARTIST;
    lastPlayedAt: null | string;
    mbz: null | string;
    name: string;
    playCount: null | number;
    serverId: string;
    serverType: ServerType;
    similarArtists: null | RelatedArtist[];
    songCount: null | number;
    userFavorite: boolean;
    userRating: null | number;
};

export type Artist = {
    biography: null | string;
    createdAt: string;
    id: string;
    itemType: LibraryItem.ARTIST;
    name: string;
    remoteCreatedAt: null | string;
    serverFolderId: string;
    serverId: string;
    serverType: ServerType;
    updatedAt: string;
};

export type RelatedAlbumArtist = {
    id: string;
    name: string;
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

export type AlbumArtistDetailArgs = BaseEndpointArgs & { query: AlbumArtistDetailQuery };

export type AlbumArtistDetailQuery = { id: string };

export type AlbumArtistDetailResponse = AlbumArtist | null;

export type ArtistListArgs = BaseEndpointArgs & { query: ArtistListQuery };

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

export type ArtistListResponse = BasePaginatedResponse<AlbumArtist[]> | null | undefined;
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

export type AlbumArtistListArgs = BaseEndpointArgs & { query: AlbumArtistListQuery };

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
export type AlbumArtistListResponse = BasePaginatedResponse<AlbumArtist[]> | null | undefined;
export type ArtistInfoArgs = BaseEndpointArgs & { query: ArtistInfoQuery };

export type ArtistInfoQuery = {
    artistId: string;
    limit: number;
    musicFolderId?: string;
};
