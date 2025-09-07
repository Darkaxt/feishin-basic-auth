import { orderBy, shuffle } from 'lodash';

import i18n from '/@/i18n/i18n';
import { JFAlbumListSort } from '/@/shared/api/jellyfin.types';
import { NDAlbumListSort } from '/@/shared/api/navidrome.types';
import {
    BasePaginatedQuery,
    BasePaginatedResponse,
} from '/@/shared/types/adapter/api-controller-types';
import { RelatedArtist } from '/@/shared/types/domain/artist-domain-types';
import { RelatedGenre } from '/@/shared/types/domain/genre-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import {
    LibraryItem,
    ListSortOrder,
    Mood,
    Participants,
    RecordLabel,
    ReleaseType,
    Tags,
} from '/@/shared/types/domain/shared-domain-types';
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

export interface AlbumListQuery extends BasePaginatedQuery<AlbumListSortOptions> {
    artistIds?: string[];
    compilation?: boolean;
    favorite?: boolean;
    genres?: string[];
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    searchTerm?: string;
}

export type AlbumListRequest = { query: AlbumListQuery; totalRecordCount?: number };

export type AlbumListResponse = BasePaginatedResponse<Album[]>;

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
    _itemType: LibraryItem.ALBUM;
    _serverId: string;
    _serverType: ServerType;
    artistName: null | string;
    artists: RelatedArtist[];
    comment: null | string;
    createdDate: null | string;
    discTitles: DiscTitle[];
    displayArtist: null | string;
    duration: null | number;
    explicit: boolean | null;
    genres: RelatedGenre[];
    id: string;
    imageUrl: null | string;
    isCompilation: boolean | null;
    mbzId: null | string;
    mbzReleaseGroupId: null | string;
    missing: boolean | null;
    moods: Mood[];
    name: string;
    originalReleaseDate: null | string;
    participants: Participants;
    recordLabels: RecordLabel[];
    releaseDate: null | string;
    releaseTypes: ReleaseType[];
    releaseYear: null | number;
    size: null | number;
    songCount: null | number;
    sortName: string;
    tags: Tags;
    updatedDate: null | string;
    userFavorite: boolean;
    userFavoriteDate: null | string;
    userLastPlayedDate: null | string;
    userPlayCount: null | number;
    userRating: null | number;
    version: null | string;
};

export type AlbumDetailQuery = { id: string };

export type AlbumDetailRequest = { query: AlbumDetailQuery };

export type AlbumDetailResponse = Album;

export type AlbumInfo = {
    imageUrl: null | string;
    notes: null | string;
};

export type AlbumWithSongs = Album & { songs: Song[] };

export type DiscTitle = {
    disc: number;
    title: string;
};

export const sortAlbumList = (albums: Album[], sortBy: AlbumListSort, sortOrder: ListSortOrder) => {
    let results = albums;

    const order = sortOrder === ListSortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
        case AlbumListSort.ALBUM_ARTIST:
            results = orderBy(
                results,
                ['albumArtist', (v) => v.name.toLowerCase()],
                [order, 'asc'],
            );
            break;
        case AlbumListSort.DURATION:
            results = orderBy(results, ['duration'], [order]);
            break;
        case AlbumListSort.FAVORITED:
            results = orderBy(results, ['starred'], [order]);
            break;
        case AlbumListSort.NAME:
            results = orderBy(results, [(v) => v.name.toLowerCase()], [order]);
            break;
        case AlbumListSort.PLAY_COUNT:
            results = orderBy(results, ['playCount'], [order]);
            break;
        case AlbumListSort.RANDOM:
            results = shuffle(results);
            break;
        case AlbumListSort.RATING:
            results = orderBy(results, ['userRating'], [order]);
            break;
        case AlbumListSort.RECENTLY_ADDED:
            results = orderBy(results, ['createdAt'], [order]);
            break;
        case AlbumListSort.RECENTLY_PLAYED:
            results = orderBy(results, ['lastPlayedAt'], [order]);
            break;
        case AlbumListSort.SONG_COUNT:
            results = orderBy(results, ['songCount'], [order]);
            break;
        case AlbumListSort.YEAR:
            results = orderBy(results, ['releaseYear'], [order]);
            break;
        default:
            break;
    }

    return results;
};
