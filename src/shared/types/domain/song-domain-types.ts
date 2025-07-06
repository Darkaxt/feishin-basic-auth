import i18n from 'src/i18n/i18n';
import { z } from 'zod';

import { JFSongListSort } from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import { NDSongListSort } from '/@/shared/api/navidrome.types';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import {
    BaseEndpointArgs,
    BasePaginatedResponse,
    BaseQuery,
    GainInfo,
    LibraryItem,
    Played,
} from '/@/shared/types/domain-types';
import { RelatedArtist } from '/@/shared/types/domain/artist-domain-types';
import { Genre } from '/@/shared/types/domain/genre-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';

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
    album: null | string;
    albumArtists: RelatedArtist[];
    albumId: string;
    artistName: string;
    artists: RelatedArtist[];
    bitRate: number;
    bpm: null | number;
    channels: null | number;
    comment: null | string;
    compilation: boolean | null;
    container: null | string;
    createdAt: string;
    discNumber: number;
    discSubtitle: null | string;
    duration: number;
    gain: GainInfo | null;
    genres: Genre[];
    id: string;
    imagePlaceholderUrl: null | string;
    imageUrl: null | string;
    itemType: LibraryItem.SONG;
    lastPlayedAt: null | string;
    lyrics: null | string;
    name: string;
    participants: null | Record<string, RelatedArtist[]>;
    path: null | string;
    peak: GainInfo | null;
    playCount: number;
    playlistItemId?: string;
    releaseDate: null | string;
    releaseYear: null | string;
    serverId: string;
    serverType: ServerType;
    size: number;
    streamUrl: string;
    tags: null | Record<string, string[]>;
    trackNumber: number;
    uniqueId: string;
    updatedAt: string;
    userFavorite: boolean;
    userRating: null | number;
};
export type SongListArgs = BaseEndpointArgs & { query: SongListQuery };

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
export type RandomSongListArgs = BaseEndpointArgs & {
    query: RandomSongListQuery;
};

export type RandomSongListQuery = {
    genre?: string;
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    played: Played;
};

export type RandomSongListResponse = SongListResponse;
export type SimilarSongsArgs = BaseEndpointArgs & {
    query: SimilarSongsQuery;
};

export type SimilarSongsQuery = {
    albumArtistIds: string[];
    count?: number;
    songId: string;
};

export type SongDetailArgs = BaseEndpointArgs & { query: SongDetailQuery };
export type SongDetailQuery = { id: string };

export type SongDetailResponse = null | Song | undefined;
export type TopSongListArgs = BaseEndpointArgs & { query: TopSongListQuery };

export type TopSongListQuery = {
    artist: string;
    artistId: string;
    limit?: number;
};

export type TopSongListResponse = BasePaginatedResponse<Song[]> | null | undefined;
