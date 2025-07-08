import {
    AlbumDetailArgs,
    AlbumDetailResponse,
    AlbumInfo,
    AlbumListArgs,
    AlbumListResponse,
} from '/@/shared/types/domain/album-domain-types';
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

export const instanceOfCancellationError = (error: any) => {
    return 'revert' in error;
};

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
    getTags?: (args: TagArgs) => Promise<TagsResponse>;
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
