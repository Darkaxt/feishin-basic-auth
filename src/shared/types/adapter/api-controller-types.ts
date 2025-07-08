import {
    AlbumDetailArgs,
    AlbumDetailResponse,
    AlbumInfo,
    AlbumListArgs,
    AlbumListResponse,
} from '/@/shared/types/domain/album-domain-types';
import { BaseEndpointArgs } from '/@/shared/types/domain/api-domain-types';
import {
    AlbumArtistDetailArgs,
    AlbumArtistDetailResponse,
    AlbumArtistListArgs,
    AlbumArtistListResponse,
    ArtistListArgs,
    ArtistListResponse,
} from '/@/shared/types/domain/artist-domain-types';
import { AuthenticationResponse } from '/@/shared/types/domain/auth-domain-types';
import { GenreListArgs, GenreListResponse } from '/@/shared/types/domain/genre-domain-types';
import {
    LyricsArgs,
    LyricsResponse,
    StructuredLyric,
    StructuredLyricsArgs,
} from '/@/shared/types/domain/lyric-domain-types';
import { TranscodingArgs } from '/@/shared/types/domain/player-domain-types';
import {
    AddToPlaylistArgs,
    AddToPlaylistResponse,
    CreatePlaylistArgs,
    CreatePlaylistResponse,
    DeletePlaylistArgs,
    DeletePlaylistResponse,
    MoveItemArgs,
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
    ServerType,
} from '/@/shared/types/domain/server-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';
import {
    RandomSongListArgs,
    SimilarSongsArgs,
    Song,
    SongDetailArgs,
    SongDetailResponse,
    SongListArgs,
    SongListResponse,
    TopSongListArgs,
    TopSongListResponse,
} from '/@/shared/types/domain/song-domain-types';
import { TagArgs, TagsResponse } from '/@/shared/types/domain/tag-domain-types';
import {
    DownloadArgs,
    FavoriteArgs,
    FavoriteResponse,
    RatingResponse,
    ScrobbleArgs,
    ScrobbleResponse,
    SetRatingArgs,
    ShareItemArgs,
    ShareItemResponse,
    UserListArgs,
    UserListResponse,
} from '/@/shared/types/domain/user-domain-types';

export interface AdapterError {
    code: number;
    message: string;
}

export type AdapterFn<TRequest, TResponse> = (
    request: TRequest,
    server: ServerListItem,
    options?: AdapterRequestOptions,
) => Promise<[AdapterError, null] | [null, TResponse]>;

export interface AdapterRequestOptions {
    cache?: 'default' | 'force-cache' | 'no-cache' | 'no-store' | 'only-if-cached' | 'reload';
    credentials?: 'include' | 'omit' | 'same-origin';
    integrity?: string;
    keepalive?: boolean;
    mode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin';
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
    window?: null;
}

export type ControllerEndpoint = {
    album: {
        getDetail: (args: AlbumDetailArgs) => Promise<AlbumDetailResponse>;
        getInfo?: (args: AlbumDetailArgs) => Promise<AlbumInfo>;
        getList: (args: AlbumListArgs) => Promise<AlbumListResponse>;
        getListCount: (args: AlbumListArgs) => Promise<number>;
    };
    albumArtist: {
        getDetail: (args: AlbumArtistDetailArgs) => Promise<AlbumArtistDetailResponse>;
        getList: (args: AlbumArtistListArgs) => Promise<AlbumArtistListResponse>;
        getListCount: (args: AlbumArtistListArgs) => Promise<number>;
    };
    artist: {
        getList: (args: ArtistListArgs) => Promise<ArtistListResponse>;
        getListCount: (args: ArtistListArgs) => Promise<number>;
    };
    favorite: {
        create: (args: FavoriteArgs) => Promise<FavoriteResponse>;
        delete: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    };
    genre: {
        getList: (args: GenreListArgs) => Promise<GenreListResponse>;
    };
    musicFolder: {
        getList: (args: ServerMusicFolderListArgs) => Promise<ServerMusicFolderListResponse>;
    };
    playlist: {
        addTo: (args: AddToPlaylistArgs) => Promise<AddToPlaylistResponse>;
        create: (args: CreatePlaylistArgs) => Promise<CreatePlaylistResponse>;
        delete: (args: DeletePlaylistArgs) => Promise<DeletePlaylistResponse>;
        getDetail: (args: PlaylistDetailArgs) => Promise<PlaylistDetailResponse>;
        getList: (args: PlaylistListArgs) => Promise<PlaylistListResponse>;
        getListCount: (args: PlaylistListArgs) => Promise<number>;
        getSongList: (args: PlaylistSongListArgs) => Promise<SongListResponse>;
        moveItem?: (args: MoveItemArgs) => Promise<void>;
        removeFrom: (args: RemoveFromPlaylistArgs) => Promise<RemoveFromPlaylistResponse>;
        update: (args: UpdatePlaylistArgs) => Promise<UpdatePlaylistResponse>;
    };
    server: {
        authenticate: (
            url: string,
            body: { legacy?: boolean; password: string; username: string },
        ) => Promise<AuthenticationResponse>;
        getCoverArtUrl: (
            args: { id: string; size?: number; type: LibraryItem },
            server: ServerListItem,
        ) => string;
        getRoles: (
            args: BaseEndpointArgs,
        ) => Promise<Array<string | { label: string; value: string }>>;
        getServerInfo: (args: ServerInfoArgs) => Promise<ServerInfo>;
        getStreamUrl: (
            args: { bitRate?: number; format?: string; id: string },
            server: ServerListItem,
        ) => string;
        getTags: (args: TagArgs) => Promise<TagsResponse>;
        getTranscodingUrl: (args: TranscodingArgs) => string;
        getType: () => ServerType;
        scrobble: (args: ScrobbleArgs) => Promise<ScrobbleResponse>;
        search: (args: SearchArgs) => Promise<SearchResponse>;
    };
    song: {
        getDetail: (args: SongDetailArgs) => Promise<SongDetailResponse>;
        getDownloadUrl: (args: DownloadArgs) => string;
        getList: (args: SongListArgs) => Promise<SongListResponse>;
        getListCount: (args: SongListArgs) => Promise<number>;
        getLyrics?: (args: LyricsArgs) => Promise<LyricsResponse>;
        getRandomList: (args: RandomSongListArgs) => Promise<SongListResponse>;
        getSimilar: (args: SimilarSongsArgs) => Promise<Song[]>;
        getStructuredLyrics?: (args: StructuredLyricsArgs) => Promise<StructuredLyric[]>;
        getTopList: (args: TopSongListArgs) => Promise<TopSongListResponse>;
    };
    user: {
        getList?: (args: UserListArgs) => Promise<UserListResponse>;
        setRating?: (args: SetRatingArgs) => Promise<RatingResponse>;
        shareItem?: (args: ShareItemArgs) => Promise<ShareItemResponse>;
    };
};

export type ExtractAdapterResponse<T> = T extends AdapterFn<any, infer R> ? R : never;
