import i18n from '/@/i18n/i18n';
import { BasePaginatedResponse } from '/@/shared/types/adapter/api-controller-types';

export enum ServerListSortOptions {
    CREATED_AT = 'createdAt',
    NAME = 'name',
    TYPE = 'type',
    UPDATED_AT = 'updatedAt',
}

export const ServerListSortOptionsLabels = {
    [ServerListSortOptions.CREATED_AT]: i18n.t('filter.createdAt'),
    [ServerListSortOptions.NAME]: i18n.t('filter.name'),
    [ServerListSortOptions.TYPE]: i18n.t('filter.type'),
    [ServerListSortOptions.UPDATED_AT]: i18n.t('filter.updatedAt'),
};

export enum ServerFeature {
    BFR = 'bfr',
    LYRICS_MULTIPLE_STRUCTURED = 'lyricsMultipleStructured',
    LYRICS_SINGLE_STRUCTURED = 'lyricsSingleStructured',
    PLAYLISTS_SMART = 'playlistsSmart',
    PUBLIC_PLAYLIST = 'publicPlaylist',
    SHARING_ALBUM_SONG = 'sharingAlbumSong',
    TAGS = 'tags',
}

export enum ServerType {
    JELLYFIN = 'jellyfin',
    NAVIDROME = 'navidrome',
    SUBSONIC = 'subsonic',
}

export type ServerFeatures = Partial<Record<ServerFeature, number[]>>;

export type ServerInfo = {
    features: ServerFeatures;
    id?: string;
    version: string;
};

export type ServerInfoRequest = null;

export type ServerListItem = {
    credential: string;
    features?: ServerFeatures;
    id: string;
    name: string;
    savePassword?: boolean;
    type: ServerType;
    url: string;
    username: string;
    version?: string;
};

export type ServerMusicFolder = {
    id: string;
    name: string;
};

export type ServerMusicFolderListQuery = null;

export type ServerMusicFolderListRequest = null;

export type ServerMusicFolderListResponse =
    | BasePaginatedResponse<ServerMusicFolder[]>
    | null
    | undefined;

export type ServerMusicFoldersResponse = ServerMusicFolder[];
