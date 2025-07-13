import { orderBy, reverse, shuffle } from 'lodash';
import { z } from 'zod';

import i18n from '/@/i18n/i18n';
import { JFSongListSort } from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import { NDSongListSort } from '/@/shared/api/navidrome.types';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import { BasePaginatedResponse, BaseQuery } from '/@/shared/types/adapter/api-controller-types';
import { RelatedArtist } from '/@/shared/types/domain/artist-domain-types';
import { RelatedGenre } from '/@/shared/types/domain/genre-domain-types';
import { Played, QueueSong } from '/@/shared/types/domain/player-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import {
    LibraryItem,
    ListSortOrder,
    Mood,
    Participants,
    Tags,
} from '/@/shared/types/domain/shared-domain-types';

export enum SongListSortOptions {
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    BPM = 'bpm',
    CHANNELS = 'channels',
    COMMENT = 'comment',
    DURATION = 'duration',
    GENRE = 'genre',
    ID = 'id',
    IS_FAVORITE = 'isFavorite',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'recentlyAdded',
    RECENTLY_PLAYED = 'recentlyPlayed',
    RELEASE_DATE = 'releaseDate',
    YEAR = 'year',
}

export const SongListSortOptionsLabels = {
    [SongListSortOptions.ALBUM]: i18n.t('filter.album'),
    [SongListSortOptions.ALBUM_ARTIST]: i18n.t('filter.albumArtist'),
    [SongListSortOptions.ARTIST]: i18n.t('filter.artist'),
    [SongListSortOptions.BPM]: i18n.t('filter.bpm'),
    [SongListSortOptions.CHANNELS]: i18n.t('filter.channels'),
    [SongListSortOptions.COMMENT]: i18n.t('filter.comment'),
    [SongListSortOptions.DURATION]: i18n.t('filter.duration'),
    [SongListSortOptions.GENRE]: i18n.t('filter.genre'),
    [SongListSortOptions.ID]: i18n.t('filter.id'),
    [SongListSortOptions.IS_FAVORITE]: i18n.t('filter.isFavorite'),
    [SongListSortOptions.NAME]: i18n.t('filter.name'),
    [SongListSortOptions.PLAY_COUNT]: i18n.t('filter.playCount'),
    [SongListSortOptions.RANDOM]: i18n.t('filter.random'),
    [SongListSortOptions.RATING]: i18n.t('filter.rating'),
    [SongListSortOptions.RECENTLY_ADDED]: i18n.t('filter.recentlyAdded'),
    [SongListSortOptions.RECENTLY_PLAYED]: i18n.t('filter.recentlyPlayed'),
    [SongListSortOptions.RELEASE_DATE]: i18n.t('filter.releaseDate'),
    [SongListSortOptions.YEAR]: i18n.t('filter.year'),
};

export enum SongListSort {
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    BPM = 'bpm',
    CHANNELS = 'channels',
    COMMENT = 'comment',
    DURATION = 'duration',
    FAVORITED = 'favorited',
    GENRE = 'genre',
    ID = 'id',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'recentlyAdded',
    RECENTLY_PLAYED = 'recentlyPlayed',
    RELEASE_DATE = 'releaseDate',
    YEAR = 'year',
}

export type Song = {
    _itemType: LibraryItem.SONG;
    _serverId: string;
    _serverType: ServerType;
    album: null | string;
    albumArtistName: null | string;
    albumArtists: RelatedArtist[];
    albumId: null | string;
    artistName: null | string;
    artists: RelatedArtist[];
    bitDepth: null | number;
    bitRate: null | number;
    bpm: null | number;
    channels: null | number;
    comment: null | string;
    composer: null | string;
    container: null | string;
    createdDate: null | string;
    discNumber: number;
    discSubtitle: null | string;
    duration: number;
    explicit: boolean | null;
    gain: GainInfo | null;
    genres: RelatedGenre[];
    id: string;
    imageUrl: null | string;
    isCompilation: boolean | null;
    isrc: string[];
    lyrics: null | string;
    mbzId: null | string;
    missing: boolean | null;
    moods: Mood[];
    name: string;
    participants: Participants;
    path: null | string;
    peak: GainInfo | null;
    playCount: number;
    releaseDate: null | string;
    releaseYear: null | number;
    samplingRate: null | number;
    size: number;
    sortName: string;
    streamUrl: string;
    tags: Tags;
    trackNumber: number;
    updatedDate: null | string;
    userFavorite: boolean;
    userFavoriteDate: null | string;
    userLastPlayedDate: null | string;
    userRating: null | number;
};

export interface SongListQuery extends BaseQuery<SongListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.songList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.songList>>;
    };
    albumArtistIds?: string[];
    albumIds?: string[];
    artistIds?: string[];
    favorite?: boolean;
    genreIds?: string[];
    imageSize?: number;
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    role?: string;
    searchTerm?: string;
    startIndex: number;
}

export type SongListRequest = { query: SongListQuery };

export type SongListResponse = BasePaginatedResponse<Song[]> | null | undefined;
type SongListSortMap = {
    jellyfin: Record<SongListSort, JFSongListSort | undefined>;
    navidrome: Record<SongListSort, NDSongListSort | undefined>;
    subsonic: Record<SongListSort, undefined>;
};

export const songListSortMap: SongListSortMap = {
    jellyfin: {
        album: JFSongListSort.ALBUM,
        albumArtist: JFSongListSort.ALBUM_ARTIST,
        artist: JFSongListSort.ARTIST,
        bpm: undefined,
        channels: undefined,
        comment: undefined,
        duration: JFSongListSort.DURATION,
        favorited: undefined,
        genre: undefined,
        id: undefined,
        name: JFSongListSort.NAME,
        playCount: JFSongListSort.PLAY_COUNT,
        random: JFSongListSort.RANDOM,
        rating: undefined,
        recentlyAdded: JFSongListSort.RECENTLY_ADDED,
        recentlyPlayed: JFSongListSort.RECENTLY_PLAYED,
        releaseDate: JFSongListSort.RELEASE_DATE,
        year: undefined,
    },
    navidrome: {
        album: NDSongListSort.ALBUM_SONGS,
        albumArtist: NDSongListSort.ALBUM_ARTIST,
        artist: NDSongListSort.ARTIST,
        bpm: NDSongListSort.BPM,
        channels: NDSongListSort.CHANNELS,
        comment: NDSongListSort.COMMENT,
        duration: NDSongListSort.DURATION,
        favorited: NDSongListSort.FAVORITED,
        genre: NDSongListSort.GENRE,
        id: NDSongListSort.ID,
        name: NDSongListSort.TITLE,
        playCount: NDSongListSort.PLAY_COUNT,
        random: NDSongListSort.RANDOM,
        rating: NDSongListSort.RATING,
        recentlyAdded: NDSongListSort.RECENTLY_ADDED,
        recentlyPlayed: NDSongListSort.PLAY_DATE,
        releaseDate: undefined,
        year: NDSongListSort.YEAR,
    },
    subsonic: {
        album: undefined,
        albumArtist: undefined,
        artist: undefined,
        bpm: undefined,
        channels: undefined,
        comment: undefined,
        duration: undefined,
        favorited: undefined,
        genre: undefined,
        id: undefined,
        name: undefined,
        playCount: undefined,
        random: undefined,
        rating: undefined,
        recentlyAdded: undefined,
        recentlyPlayed: undefined,
        releaseDate: undefined,
        year: undefined,
    },
};

export type GainInfo = {
    album?: number;
    track?: number;
};

export type RandomSongListQuery = {
    genre?: string;
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    played: Played;
};

export type RandomSongListRequest = { query: RandomSongListQuery };

export type RandomSongListResponse = SongListResponse;

export type SimilarSongsQuery = {
    albumArtistIds: string[];
    count?: number;
    songId: string;
};

export type SimilarSongsRequest = { query: SimilarSongsQuery };

export type SongDetailQuery = { id: string };

export type SongDetailRequest = { query: SongDetailQuery };

export type SongDetailResponse = null | Song | undefined;

export type TopSongListQuery = {
    artist: string;
    artistId: string;
    limit?: number;
};

export type TopSongListRequest = { query: TopSongListQuery };

export type TopSongListResponse = BasePaginatedResponse<Song[]> | null | undefined;

export const sortSongList = (
    songs: QueueSong[],
    sortBy: SongListSort,
    sortOrder: ListSortOrder,
) => {
    let results = songs;

    const order = sortOrder === ListSortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
        case SongListSort.ALBUM:
            results = orderBy(
                results,
                [(v) => v.album?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ALBUM_ARTIST:
            results = orderBy(
                results,
                ['albumArtist', (v) => v.album?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ARTIST:
            results = orderBy(
                results,
                ['artist', (v) => v.album?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.DURATION:
            results = orderBy(results, ['duration'], [order]);
            break;

        case SongListSort.FAVORITED:
            results = orderBy(results, ['userFavorite', (v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.GENRE:
            results = orderBy(
                results,
                [
                    (v) => v.genres?.[0]?.name.toLowerCase(),
                    (v) => v.album?.toLowerCase(),
                    'discNumber',
                    'trackNumber',
                ],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ID:
            if (order === 'desc') {
                results = reverse(results as any);
            }
            break;

        case SongListSort.NAME:
            results = orderBy(results, [(v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.PLAY_COUNT:
            results = orderBy(results, ['playCount'], [order]);
            break;

        case SongListSort.RANDOM:
            results = shuffle(results);
            break;

        case SongListSort.RATING:
            results = orderBy(results, ['userRating', (v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.RECENTLY_ADDED:
            results = orderBy(results, ['created'], [order]);
            break;

        case SongListSort.YEAR:
            results = orderBy(
                results,
                ['year', (v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                [order, 'asc', 'asc', 'asc'],
            );
            break;

        default:
            break;
    }

    return results;
};
