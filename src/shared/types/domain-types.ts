import orderBy from 'lodash/orderBy';
import reverse from 'lodash/reverse';
import shuffle from 'lodash/shuffle';

import {
    AlbumArtistDetailArgs,
    AlbumArtistDetailResponse,
    AlbumArtistListArgs,
    AlbumArtistListResponse,
    AlbumArtistListSort,
    ArtistListArgs,
    ArtistListResponse,
    ArtistListSort,
} from './domain/artist-domain-types';

import { JFSortOrder } from '/@/shared/api/jellyfin.types';
import { NDSortOrder } from '/@/shared/api/navidrome.types';
import {
    Album,
    AlbumDetailArgs,
    AlbumDetailResponse,
    AlbumInfo,
    AlbumListArgs,
    AlbumListResponse,
    AlbumListSort,
} from '/@/shared/types/domain/album-domain-types';
import { AlbumArtist, Artist } from '/@/shared/types/domain/artist-domain-types';
import { GenreListArgs, GenreListResponse } from '/@/shared/types/domain/genre-domain-types';
import {
    LyricsArgs,
    LyricsResponse,
    StructuredLyric,
    StructuredLyricsArgs,
} from '/@/shared/types/domain/lyric-domain-types';
import {
    AddToPlaylistArgs,
    AddToPlaylistResponse,
    CreatePlaylistArgs,
    CreatePlaylistResponse,
    DeletePlaylistArgs,
    DeletePlaylistResponse,
    Playlist,
    PlaylistDetailArgs,
    PlaylistDetailResponse,
    PlaylistListArgs,
    PlaylistListResponse,
    PlaylistSongListArgs,
    RemoveFromPlaylistArgs,
    RemoveFromPlaylistResponse,
    UpdatePlaylistArgs,
    UpdatePlaylistResponse,
} from '/@/shared/types/domain/playlist-domain-types';
import { SearchArgs, SearchResponse } from '/@/shared/types/domain/search-domain-types';
import {
    ServerInfo,
    ServerInfoArgs,
    ServerListItem,
    ServerMusicFolderListArgs,
    ServerMusicFolderListResponse,
} from '/@/shared/types/domain/server-domain-types';
import { ListSortOrder } from '/@/shared/types/domain/shared-domain-types';
import {
    RandomSongListArgs,
    SimilarSongsArgs,
    Song,
    SongDetailArgs,
    SongDetailResponse,
    SongListArgs,
    SongListResponse,
    SongListSort,
    TopSongListArgs,
    TopSongListResponse,
} from '/@/shared/types/domain/song-domain-types';
import {
    FavoriteArgs,
    FavoriteResponse,
    RatingResponse,
    ScrobbleArgs,
    ScrobbleResponse,
    SetRatingArgs,
    UserListArgs,
    UserListResponse,
} from '/@/shared/types/domain/user-domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export enum LibraryItem {
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    GENRE = 'genre',
    PLAYLIST = 'playlist',
    SONG = 'song',
}

export type AnyLibraryItem = Album | AlbumArtist | Artist | Playlist | QueueSong | Song;

export type AnyLibraryItems =
    | Album[]
    | AlbumArtist[]
    | Artist[]
    | Playlist[]
    | QueueSong[]
    | Song[];

export interface PlayerData {
    current: {
        index: number;
        nextIndex?: number;
        player: 1 | 2;
        previousIndex?: number;
        shuffledIndex: number;
        song?: QueueSong;
        status: PlayerStatus;
    };
    player1?: QueueSong;
    player2?: QueueSong;
    queue: QueueData;
}

export interface QueueData {
    current?: QueueSong;
    length: number;
    next?: QueueSong;
    previous?: QueueSong;
}

export type QueueSong = Song & {
    uniqueId: string;
};

type SortOrderMap = {
    jellyfin: Record<ListSortOrder, JFSortOrder>;
    navidrome: Record<ListSortOrder, NDSortOrder>;
    subsonic: Record<ListSortOrder, undefined>;
};

export const sortOrderMap: SortOrderMap = {
    jellyfin: {
        ASC: JFSortOrder.ASC,
        DESC: JFSortOrder.DESC,
    },
    navidrome: {
        ASC: NDSortOrder.ASC,
        DESC: NDSortOrder.DESC,
    },
    subsonic: {
        ASC: undefined,
        DESC: undefined,
    },
};

export enum ExternalSource {
    LASTFM = 'LASTFM',
    MUSICBRAINZ = 'MUSICBRAINZ',
    SPOTIFY = 'SPOTIFY',
    THEAUDIODB = 'THEAUDIODB',
}

export enum ExternalType {
    ID = 'ID',
    LINK = 'LINK',
}

export enum ImageType {
    BACKDROP = 'BACKDROP',
    LOGO = 'LOGO',
    PRIMARY = 'PRIMARY',
    SCREENSHOT = 'SCREENSHOT',
}

export enum Played {
    All = 'all',
    Never = 'never',
    Played = 'played',
}

export type AuthenticationResponse = {
    credential: string;
    ndCredential?: string;
    userId: null | string;
    username: string;
};

export type BaseEndpointArgs = {
    apiClientProps: {
        server: null | ServerListItem;
        signal?: AbortSignal;
    };
};

export interface BasePaginatedResponse<T> {
    error?: any | string;
    items: T;
    startIndex: number;
    totalRecordCount: null | number;
}

export interface BaseQuery<T> {
    sortBy: T;
    sortOrder: ListSortOrder;
}

export type EndpointDetails = {
    server: ServerListItem;
};

export type GainInfo = {
    album?: number;
    track?: number;
};

export type ShareItemArgs = BaseEndpointArgs & { body: ShareItemBody; serverId?: string };

export type ShareItemBody = {
    description: string;
    downloadable: boolean;
    expires: number;
    resourceIds: string;
    resourceType: string;
};

export type ShareItemResponse = undefined | { id: string };

export const instanceOfCancellationError = (error: any) => {
    return 'revert' in error;
};

export enum LyricSource {
    GENIUS = 'Genius',
    LRCLIB = 'lrclib.net',
    NETEASE = 'NetEase',
}

export type ControllerEndpoint = {
    addToPlaylist: (args: AddToPlaylistArgs) => Promise<AddToPlaylistResponse>;
    authenticate: (
        url: string,
        body: { legacy?: boolean; password: string; username: string },
    ) => Promise<AuthenticationResponse>;
    createFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    createPlaylist: (args: CreatePlaylistArgs) => Promise<CreatePlaylistResponse>;
    deleteFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    deletePlaylist: (args: DeletePlaylistArgs) => Promise<DeletePlaylistResponse>;
    getAlbumArtistDetail: (args: AlbumArtistDetailArgs) => Promise<AlbumArtistDetailResponse>;
    getAlbumArtistList: (args: AlbumArtistListArgs) => Promise<AlbumArtistListResponse>;
    getAlbumArtistListCount: (args: AlbumArtistListArgs) => Promise<number>;
    getAlbumDetail: (args: AlbumDetailArgs) => Promise<AlbumDetailResponse>;
    getAlbumInfo?: (args: AlbumDetailArgs) => Promise<AlbumInfo>;
    getAlbumList: (args: AlbumListArgs) => Promise<AlbumListResponse>;
    getAlbumListCount: (args: AlbumListArgs) => Promise<number>;
    // getArtistInfo?: (args: any) => void;
    getArtistList: (args: ArtistListArgs) => Promise<ArtistListResponse>;
    getArtistListCount: (args: ArtistListArgs) => Promise<number>;
    getDownloadUrl: (args: DownloadArgs) => string;
    getGenreList: (args: GenreListArgs) => Promise<GenreListResponse>;
    getLyrics?: (args: LyricsArgs) => Promise<LyricsResponse>;
    getMusicFolderList: (args: ServerMusicFolderListArgs) => Promise<ServerMusicFolderListResponse>;
    getPlaylistDetail: (args: PlaylistDetailArgs) => Promise<PlaylistDetailResponse>;
    getPlaylistList: (args: PlaylistListArgs) => Promise<PlaylistListResponse>;
    getPlaylistListCount: (args: PlaylistListArgs) => Promise<number>;
    getPlaylistSongList: (args: PlaylistSongListArgs) => Promise<SongListResponse>;
    getRandomSongList: (args: RandomSongListArgs) => Promise<SongListResponse>;
    getRoles: (args: BaseEndpointArgs) => Promise<Array<string | { label: string; value: string }>>;
    getServerInfo: (args: ServerInfoArgs) => Promise<ServerInfo>;
    getSimilarSongs: (args: SimilarSongsArgs) => Promise<Song[]>;
    getSongDetail: (args: SongDetailArgs) => Promise<SongDetailResponse>;
    getSongList: (args: SongListArgs) => Promise<SongListResponse>;
    getSongListCount: (args: SongListArgs) => Promise<number>;
    getStructuredLyrics?: (args: StructuredLyricsArgs) => Promise<StructuredLyric[]>;
    getTags?: (args: TagArgs) => Promise<TagResponses>;
    getTopSongs: (args: TopSongListArgs) => Promise<TopSongListResponse>;
    getTranscodingUrl: (args: TranscodingArgs) => string;
    getUserList?: (args: UserListArgs) => Promise<UserListResponse>;
    movePlaylistItem?: (args: MoveItemArgs) => Promise<void>;
    removeFromPlaylist: (args: RemoveFromPlaylistArgs) => Promise<RemoveFromPlaylistResponse>;
    scrobble: (args: ScrobbleArgs) => Promise<ScrobbleResponse>;
    search: (args: SearchArgs) => Promise<SearchResponse>;
    setRating?: (args: SetRatingArgs) => Promise<RatingResponse>;
    shareItem?: (args: ShareItemArgs) => Promise<ShareItemResponse>;
    updatePlaylist: (args: UpdatePlaylistArgs) => Promise<UpdatePlaylistResponse>;
};

export type DownloadArgs = BaseEndpointArgs & {
    query: DownloadQuery;
};

export type DownloadQuery = {
    id: string;
};

// This type from https://wicg.github.io/local-font-access/#fontdata
// NOTE: it is still experimental, so this should be updates as appropriate
export type FontData = {
    family: string;
    fullName: string;
    postscriptName: string;
    style: string;
};

export type MoveItemArgs = BaseEndpointArgs & {
    query: MoveItemQuery;
};

export type MoveItemQuery = {
    endingIndex: number;
    playlistId: string;
    startingIndex: number;
    trackId: string;
};

export type Tag = {
    name: string;
    options: string[];
};

export type TagArgs = BaseEndpointArgs & {
    query: TagQuery;
};

export type TagQuery = {
    folder?: string;
    type: LibraryItem.ALBUM | LibraryItem.SONG;
};

export type TagResponses = {
    boolTags?: string[];
    enumTags?: Tag[];
};

export type TranscodingArgs = BaseEndpointArgs & {
    query: TranscodingQuery;
};

export type TranscodingQuery = {
    base: string;
    bitrate?: number;
    format?: string;
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
                    (v) => v.genres?.[0].name.toLowerCase(),
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

export const sortAlbumArtistList = (
    artists: AlbumArtist[],
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
