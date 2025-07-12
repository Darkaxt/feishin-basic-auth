import {
    AlbumDetailRequest,
    AlbumDetailResponse,
    AlbumInfo,
    AlbumListRequest,
    AlbumListResponse,
} from '/@/shared/types/domain/album-domain-types';
import {
    AlbumArtistDetailRequest,
    AlbumArtistDetailResponse,
    AlbumArtistListRequest,
    AlbumArtistListResponse,
    ArtistListRequest,
    ArtistListResponse,
} from '/@/shared/types/domain/artist-domain-types';
import { AuthenticationResponse } from '/@/shared/types/domain/auth-domain-types';
import { GenreListRequest, GenreListResponse } from '/@/shared/types/domain/genre-domain-types';
import {
    LyricsRequest,
    LyricsResponse,
    StructuredLyric,
    StructuredLyricsRequest,
} from '/@/shared/types/domain/lyric-domain-types';
import { TranscodingRequest } from '/@/shared/types/domain/player-domain-types';
import {
    AddToPlaylistArgs,
    AddToPlaylistResponse,
    CreatePlaylistRequest,
    CreatePlaylistResponse,
    DeletePlaylistRequest,
    DeletePlaylistResponse,
    MoveItemRequest,
    PlaylistDetailRequest,
    PlaylistDetailResponse,
    PlaylistListRequest,
    PlaylistListResponse,
    PlaylistSongListRequest,
    RemoveFromPlaylistRequest,
    RemoveFromPlaylistResponse,
    UpdatePlaylistRequest,
    UpdatePlaylistResponse,
} from '/@/shared/types/domain/playlist-domain-types';
import { SearchRequest, SearchResponse } from '/@/shared/types/domain/search-domain-types';
import {
    ServerInfo,
    ServerInfoRequest,
    ServerListItem,
    ServerMusicFolderListRequest,
    ServerMusicFolderListResponse,
    ServerType,
} from '/@/shared/types/domain/server-domain-types';
import { LibraryItem, ListSortOrder } from '/@/shared/types/domain/shared-domain-types';
import {
    RandomSongListRequest,
    SimilarSongsRequest,
    Song,
    SongDetailRequest,
    SongDetailResponse,
    SongListRequest,
    SongListResponse,
    TopSongListRequest,
    TopSongListResponse,
} from '/@/shared/types/domain/song-domain-types';
import { TagRequest, TagsResponse } from '/@/shared/types/domain/tag-domain-types';
import {
    DownloadRequest,
    FavoriteRequest,
    FavoriteResponse,
    RatingResponse,
    ScrobbleRequest,
    ScrobbleResponse,
    SetRatingRequest,
    ShareItemRequest,
    ShareItemResponse,
    UserListRequest,
    UserListResponse,
} from '/@/shared/types/domain/user-domain-types';

export type ApiClientProps = {
    baseUrl?: string;
    cache?: 'default' | 'force-cache' | 'no-cache' | 'no-store' | 'only-if-cached' | 'reload';
    credentials?: 'include' | 'omit' | 'same-origin';
    integrity?: string;
    keepalive?: boolean;
    mode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin';
    parseAs?: 'arrayBuffer' | 'blob' | 'json' | 'text';
    priority?: 'auto' | 'high' | 'low';
    redirect?: 'error' | 'follow' | 'manual';
    referrer?: string;
    referrerPolicy?:
        | ''
        | 'no-referrer'
        | 'no-referrer-when-downgrade'
        | 'origin'
        | 'origin-when-cross-origin'
        | 'same-origin'
        | 'strict-origin'
        | 'strict-origin-when-cross-origin'
        | 'unsafe-url';
    signal?: AbortSignal | null;
};

export type ApiController = {
    _utility: {
        getDownloadUrl: ApiControllerFn<DownloadRequest, string>;
        getImageUrl: (
            args: { id: string; size?: number; type: LibraryItem },
            server: ServerListItem,
        ) => string;
        getStreamUrl: (
            args: { bitRate?: number; format?: string; id: string },
            server: ServerListItem,
        ) => string;
    };
    album: {
        getDetail: ApiControllerFn<AlbumDetailRequest, AlbumDetailResponse>;
        getInfo?: ApiControllerFn<AlbumDetailRequest, AlbumInfo>;
        getList: ApiControllerFn<AlbumListRequest, AlbumListResponse>;
        getListCount: ApiControllerFn<AlbumListRequest, number>;
    };
    albumArtist: {
        getDetail: ApiControllerFn<AlbumArtistDetailRequest, AlbumArtistDetailResponse>;
        getList: ApiControllerFn<AlbumArtistListRequest, AlbumArtistListResponse>;
        getListCount: ApiControllerFn<AlbumArtistListRequest, number>;
    };
    artist: {
        getList: ApiControllerFn<ArtistListRequest, ArtistListResponse>;
        getListCount: ApiControllerFn<ArtistListRequest, number>;
    };
    favorite: {
        create: ApiControllerFn<FavoriteRequest, FavoriteResponse>;
        delete: ApiControllerFn<FavoriteRequest, FavoriteResponse>;
    };
    genre: {
        getList: ApiControllerFn<GenreListRequest, GenreListResponse>;
    };
    musicFolder: {
        getList: ApiControllerFn<ServerMusicFolderListRequest, ServerMusicFolderListResponse>;
    };
    playlist: {
        addTo: ApiControllerFn<AddToPlaylistArgs, AddToPlaylistResponse>;
        create: ApiControllerFn<CreatePlaylistRequest, CreatePlaylistResponse>;
        delete: ApiControllerFn<DeletePlaylistRequest, DeletePlaylistResponse>;
        getDetail: ApiControllerFn<PlaylistDetailRequest, PlaylistDetailResponse>;
        getList: ApiControllerFn<PlaylistListRequest, PlaylistListResponse>;
        getListCount: ApiControllerFn<PlaylistListRequest, number>;
        getSongList: ApiControllerFn<PlaylistSongListRequest, SongListResponse>;
        moveItem?: ApiControllerFn<MoveItemRequest, void>;
        removeFrom: ApiControllerFn<RemoveFromPlaylistRequest, RemoveFromPlaylistResponse>;
        update: ApiControllerFn<UpdatePlaylistRequest, UpdatePlaylistResponse>;
    };
    server: {
        authenticate: (
            url: string,
            body: { legacy?: boolean; password: string; username: string },
        ) => Promise<AuthenticationResponse>;
        getRoles: ApiControllerFn<
            BaseEndpointArgs,
            Array<string | { label: string; value: string }>
        >;
        getServerInfo: ApiControllerFn<ServerInfoRequest, ServerInfo>;
        getTags: ApiControllerFn<TagRequest, TagsResponse>;
        getTranscodingUrl: ApiControllerFn<TranscodingRequest, string>;
        getType: () => ServerType;
        scrobble: ApiControllerFn<ScrobbleRequest, ScrobbleResponse>;
        search: ApiControllerFn<SearchRequest, SearchResponse>;
    };
    song: {
        getDetail: ApiControllerFn<SongDetailRequest, SongDetailResponse>;
        getList: ApiControllerFn<SongListRequest, SongListResponse>;
        getListCount: ApiControllerFn<SongListRequest, number>;
        getLyrics?: ApiControllerFn<LyricsRequest, LyricsResponse>;
        getRandomList: ApiControllerFn<RandomSongListRequest, SongListResponse>;
        getSimilar: ApiControllerFn<SimilarSongsRequest, Song[]>;
        getStructuredLyrics?: ApiControllerFn<StructuredLyricsRequest, StructuredLyric[]>;
        getTopList: ApiControllerFn<TopSongListRequest, TopSongListResponse>;
    };
    user: {
        getList?: ApiControllerFn<UserListRequest, UserListResponse>;
        setRating?: ApiControllerFn<SetRatingRequest, RatingResponse>;
        shareItem?: ApiControllerFn<ShareItemRequest, ShareItemResponse>;
    };
};

export interface ApiControllerError {
    code: number;
    message: string;
}

export type ApiControllerFn<TRequest, TResponse> = (
    request: TRequest,
    server: ServerListItem,
    options?: ApiClientProps,
) => Promise<[ApiControllerError, null] | [null, TResponse]>;

export type BaseEndpointArgs = {
    apiClientProps: {
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

export type ExtractControllerResponse<T> = T extends ApiControllerFn<any, infer R> ? R : never;
