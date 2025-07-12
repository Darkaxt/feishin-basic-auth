import { BaseEndpointArgs } from '/@/shared/types/adapter/api-controller-types';
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
    ServerMusicFolderListRequest,
    ServerMusicFolderListResponse,
} from '/@/shared/types/domain/server-domain-types';
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

export const instanceOfCancellationError = (error: any) => {
    return 'revert' in error;
};

export type ControllerEndpoint = {
    addToPlaylist: (args: AddToPlaylistArgs) => Promise<AddToPlaylistResponse>;
    authenticate: (
        url: string,
        body: { legacy?: boolean; password: string; username: string },
    ) => Promise<AuthenticationResponse>;
    createFavorite: (args: FavoriteRequest) => Promise<FavoriteResponse>;
    createPlaylist: (args: CreatePlaylistRequest) => Promise<CreatePlaylistResponse>;
    deleteFavorite: (args: FavoriteRequest) => Promise<FavoriteResponse>;
    deletePlaylist: (args: DeletePlaylistRequest) => Promise<DeletePlaylistResponse>;
    getAlbumArtistDetail: (args: AlbumArtistDetailRequest) => Promise<AlbumArtistDetailResponse>;
    getAlbumArtistList: (args: AlbumArtistListRequest) => Promise<AlbumArtistListResponse>;
    getAlbumArtistListCount: (args: AlbumArtistListRequest) => Promise<number>;
    getAlbumDetail: (args: AlbumDetailRequest) => Promise<AlbumDetailResponse>;
    getAlbumInfo?: (args: AlbumDetailRequest) => Promise<AlbumInfo>;
    getAlbumList: (args: AlbumListRequest) => Promise<AlbumListResponse>;
    getAlbumListCount: (args: AlbumListRequest) => Promise<number>;
    getArtistList: (args: ArtistListRequest) => Promise<ArtistListResponse>;
    getArtistListCount: (args: ArtistListRequest) => Promise<number>;
    getDownloadUrl: (args: DownloadRequest) => string;
    getGenreList: (args: GenreListRequest) => Promise<GenreListResponse>;
    getLyrics?: (args: LyricsRequest) => Promise<LyricsResponse>;
    getMusicFolderList: (
        args: ServerMusicFolderListRequest,
    ) => Promise<ServerMusicFolderListResponse>;
    getPlaylistDetail: (args: PlaylistDetailRequest) => Promise<PlaylistDetailResponse>;
    getPlaylistList: (args: PlaylistListRequest) => Promise<PlaylistListResponse>;
    getPlaylistListCount: (args: PlaylistListRequest) => Promise<number>;
    getPlaylistSongList: (args: PlaylistSongListRequest) => Promise<SongListResponse>;
    getRandomSongList: (args: RandomSongListRequest) => Promise<SongListResponse>;
    getRoles: (args: BaseEndpointArgs) => Promise<Array<string | { label: string; value: string }>>;
    getServerInfo: (args: ServerInfoRequest) => Promise<ServerInfo>;
    getSimilarSongs: (args: SimilarSongsRequest) => Promise<Song[]>;
    getSongDetail: (args: SongDetailRequest) => Promise<SongDetailResponse>;
    getSongList: (args: SongListRequest) => Promise<SongListResponse>;
    getSongListCount: (args: SongListRequest) => Promise<number>;
    getStructuredLyrics?: (args: StructuredLyricsRequest) => Promise<StructuredLyric[]>;
    getTags?: (args: TagRequest) => Promise<TagsResponse>;
    getTopSongs: (args: TopSongListRequest) => Promise<TopSongListResponse>;
    getTranscodingUrl: (args: TranscodingRequest) => string;
    getUserList?: (args: UserListRequest) => Promise<UserListResponse>;
    movePlaylistItem?: (args: MoveItemRequest) => Promise<void>;
    removeFromPlaylist: (args: RemoveFromPlaylistRequest) => Promise<RemoveFromPlaylistResponse>;
    scrobble: (args: ScrobbleRequest) => Promise<ScrobbleResponse>;
    search: (args: SearchRequest) => Promise<SearchResponse>;
    setRating?: (args: SetRatingRequest) => Promise<RatingResponse>;
    shareItem?: (args: ShareItemRequest) => Promise<ShareItemResponse>;
    updatePlaylist: (args: UpdatePlaylistRequest) => Promise<UpdatePlaylistResponse>;
};
