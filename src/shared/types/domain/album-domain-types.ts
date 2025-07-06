import i18n from 'src/i18n/i18n';
import { z } from 'zod';

import { JFAlbumListSort } from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import { NDAlbumListSort } from '/@/shared/api/navidrome.types';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import {
    BaseEndpointArgs,
    BasePaginatedResponse,
    BaseQuery,
    LibraryItem,
} from '/@/shared/types/domain-types';
import { RelatedArtist } from '/@/shared/types/domain/artist-domain-types';
import { Genre } from '/@/shared/types/domain/genre-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import { Song } from '/@/shared/types/domain/song-domain-types';

export enum AlbumListSortOptions {
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    COMMUNITY_RATING = 'communityRating',
    CRITIC_RATING = 'criticRating',
    DATE_ADDED = 'dateAdded',
    DATE_PLAYED = 'datePlayed',
    DURATION = 'duration',
    IS_FAVORITE = 'isFavorite',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RANDOM = 'random',
    RATING = 'rating',
    RELEASE_DATE = 'releaseDate',
    TRACK_COUNT = 'trackCount',
    YEAR = 'year',
}

export const AlbumListSortOptionsLabels = {
    [AlbumListSortOptions.ALBUM_ARTIST]: i18n.t('filter.albumArtist'),
    [AlbumListSortOptions.ARTIST]: i18n.t('filter.artist'),
    [AlbumListSortOptions.COMMUNITY_RATING]: i18n.t('filter.communityRating'),
    [AlbumListSortOptions.CRITIC_RATING]: i18n.t('filter.criticRating'),
    [AlbumListSortOptions.DATE_ADDED]: i18n.t('filter.dateAdded'),
    [AlbumListSortOptions.DATE_PLAYED]: i18n.t('filter.datePlayed'),
    [AlbumListSortOptions.DURATION]: i18n.t('filter.duration'),
    [AlbumListSortOptions.IS_FAVORITE]: i18n.t('filter.isFavorite'),
    [AlbumListSortOptions.NAME]: i18n.t('filter.name'),
    [AlbumListSortOptions.PLAY_COUNT]: i18n.t('filter.playCount'),
    [AlbumListSortOptions.RANDOM]: i18n.t('filter.random'),
    [AlbumListSortOptions.RATING]: i18n.t('filter.rating'),
    [AlbumListSortOptions.RELEASE_DATE]: i18n.t('filter.releaseDate'),
    [AlbumListSortOptions.TRACK_COUNT]: i18n.t('filter.trackCount'),
    [AlbumListSortOptions.YEAR]: i18n.t('filter.year'),
};
export enum AlbumListSort {
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    COMMUNITY_RATING = 'communityRating',
    CRITIC_RATING = 'criticRating',
    DURATION = 'duration',
    FAVORITED = 'favorited',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'recentlyAdded',
    RECENTLY_PLAYED = 'recentlyPlayed',
    RELEASE_DATE = 'releaseDate',
    SONG_COUNT = 'songCount',
    YEAR = 'year',
}

export type AlbumListArgs = BaseEndpointArgs & { query: AlbumListQuery };

export interface AlbumListQuery extends BaseQuery<AlbumListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.albumList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.albumList>>;
    };
    artistIds?: string[];
    compilation?: boolean;
    favorite?: boolean;
    genres?: string[];
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    searchTerm?: string;
    startIndex: number;
}
// Album List

export type AlbumListResponse = BasePaginatedResponse<Album[]> | null | undefined;
type AlbumListSortMap = {
    jellyfin: Record<AlbumListSort, JFAlbumListSort | undefined>;
    navidrome: Record<AlbumListSort, NDAlbumListSort | undefined>;
    subsonic: Record<AlbumListSort, undefined>;
};

export const albumListSortMap: AlbumListSortMap = {
    jellyfin: {
        albumArtist: JFAlbumListSort.ALBUM_ARTIST,
        artist: undefined,
        communityRating: JFAlbumListSort.COMMUNITY_RATING,
        criticRating: JFAlbumListSort.CRITIC_RATING,
        duration: undefined,
        favorited: undefined,
        name: JFAlbumListSort.NAME,
        playCount: JFAlbumListSort.PLAY_COUNT,
        random: JFAlbumListSort.RANDOM,
        rating: undefined,
        recentlyAdded: JFAlbumListSort.RECENTLY_ADDED,
        recentlyPlayed: undefined,
        releaseDate: JFAlbumListSort.RELEASE_DATE,
        songCount: undefined,
        year: undefined,
    },
    navidrome: {
        albumArtist: NDAlbumListSort.ALBUM_ARTIST,
        artist: NDAlbumListSort.ARTIST,
        communityRating: undefined,
        criticRating: undefined,
        duration: NDAlbumListSort.DURATION,
        favorited: NDAlbumListSort.STARRED,
        name: NDAlbumListSort.NAME,
        playCount: NDAlbumListSort.PLAY_COUNT,
        random: NDAlbumListSort.RANDOM,
        rating: NDAlbumListSort.RATING,
        recentlyAdded: NDAlbumListSort.RECENTLY_ADDED,
        recentlyPlayed: NDAlbumListSort.PLAY_DATE,
        // Recent versions of Navidrome support release date, but fallback to year for now
        releaseDate: NDAlbumListSort.YEAR,
        songCount: NDAlbumListSort.SONG_COUNT,
        year: NDAlbumListSort.YEAR,
    },
    subsonic: {
        albumArtist: undefined,
        artist: undefined,
        communityRating: undefined,
        criticRating: undefined,
        duration: undefined,
        favorited: undefined,
        name: undefined,
        playCount: undefined,
        random: undefined,
        rating: undefined,
        recentlyAdded: undefined,
        recentlyPlayed: undefined,
        releaseDate: undefined,
        songCount: undefined,
        year: undefined,
    },
};
export type Album = {
    albumArtist: string;
    albumArtists: RelatedArtist[];
    artists: RelatedArtist[];
    backdropImageUrl: null | string;
    comment: null | string;
    createdAt: string;
    duration: null | number;
    genres: Genre[];
    id: string;
    imagePlaceholderUrl: null | string;
    imageUrl: null | string;
    isCompilation: boolean | null;
    itemType: LibraryItem.ALBUM;
    lastPlayedAt: null | string;
    mbzId: null | string;
    name: string;
    originalDate: null | string;
    participants: null | Record<string, RelatedArtist[]>;
    playCount: null | number;
    releaseDate: null | string;
    releaseYear: null | number;
    serverId: string;
    serverType: ServerType;
    size: null | number;
    songCount: null | number;
    songs?: Song[];
    tags: null | Record<string, string[]>;
    uniqueId: string;
    updatedAt: string;
    userFavorite: boolean;
    userRating: null | number;
} & { songs?: Song[] };

export type AlbumDetailArgs = BaseEndpointArgs & { query: AlbumDetailQuery };
// Album Detail

export type AlbumDetailQuery = { id: string };

export type AlbumDetailResponse = Album | null | undefined;
export type AlbumInfo = {
    imageUrl: null | string;
    notes: null | string;
};
