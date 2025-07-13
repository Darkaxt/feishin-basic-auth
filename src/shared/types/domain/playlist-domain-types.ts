import { z } from 'zod';

import i18n from '/@/i18n/i18n';
import { JFPlaylistListSort } from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import { NDPlaylistListSort } from '/@/shared/api/navidrome.types';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import {
    BaseEndpointArgs,
    BasePaginatedResponse,
    BaseQuery,
} from '/@/shared/types/adapter/api-controller-types';
import { Genre, RelatedGenre } from '/@/shared/types/domain/genre-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem, ListSortOrder } from '/@/shared/types/domain/shared-domain-types';
import { Song, SongListSort } from '/@/shared/types/domain/song-domain-types';

export enum PlaylistListSortOptions {
    DURATION = 'duration',
    NAME = 'name',
    OWNER = 'owner',
    PUBLIC = 'public',
    TRACK_COUNT = 'trackCount',
    UPDATED_AT = 'updatedAt',
}

export const PlaylistListSortOptionsLabels = {
    [PlaylistListSortOptions.DURATION]: i18n.t('filter.duration'),
    [PlaylistListSortOptions.NAME]: i18n.t('filter.name'),
    [PlaylistListSortOptions.OWNER]: i18n.t('filter.owner'),
    [PlaylistListSortOptions.PUBLIC]: i18n.t('filter.public'),
    [PlaylistListSortOptions.TRACK_COUNT]: i18n.t('filter.trackCount'),
    [PlaylistListSortOptions.UPDATED_AT]: i18n.t('filter.updatedAt'),
};

export enum PlaylistListSort {
    DURATION = 'duration',
    NAME = 'name',
    OWNER = 'owner',
    PUBLIC = 'public',
    SONG_COUNT = 'songCount',
    UPDATED_AT = 'updatedAt',
}

export type AddToPlaylistArgs = BaseEndpointArgs & {
    body: AddToPlaylistBody;
    query: AddToPlaylistQuery;
    serverId?: string;
};

export type AddToPlaylistBody = {
    songId: string[];
};

export type AddToPlaylistQuery = {
    id: string;
};

export type AddToPlaylistResponse = null | undefined;

export type CreatePlaylistBody = {
    _custom?: {
        navidrome?: {
            owner?: string;
            ownerId?: string;
            rules?: Record<string, any>;
            sync?: boolean;
        };
    };
    comment?: string;
    name: string;
    public?: boolean;
};

export type CreatePlaylistRequest = {
    body: CreatePlaylistBody;
    serverId?: string;
};

export type CreatePlaylistResponse = undefined | { id: string };

export type DeletePlaylistQuery = { id: string };

export type DeletePlaylistRequest = {
    query: DeletePlaylistQuery;
    serverId?: string;
};

export type DeletePlaylistResponse = null | undefined;

export type Playlist = {
    _itemType: LibraryItem.PLAYLIST;
    _serverId: string;
    _serverType: ServerType;
    createdDate: null | string;
    description: null | string;
    duration: null | number;
    genres: RelatedGenre[];
    id: string;
    imageUrl: null | string;
    name: string;
    owner: null | string;
    ownerId: null | string;
    public: boolean | null;
    rules?: null | Record<string, any>;
    size: null | number;
    songCount: null | number;
    sync?: boolean | null;
    updatedDate: null | string;
};

export interface PlaylistListQuery extends BaseQuery<PlaylistListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.playlistList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.playlistList>>;
    };
    limit?: number;
    searchTerm?: string;
    startIndex: number;
}

export type PlaylistListRequest = { query: PlaylistListQuery };

export type PlaylistListResponse = BasePaginatedResponse<Playlist[]> | null | undefined;

export type PlaylistSong = Song & {
    playlistItemId: string;
};

export type RemoveFromPlaylistQuery = {
    id: string;
    songId: string[];
};

export type RemoveFromPlaylistRequest = {
    query: RemoveFromPlaylistQuery;
    serverId?: string;
};

export type RemoveFromPlaylistResponse = null | undefined;

export type UpdatePlaylistBody = {
    _custom?: {
        navidrome?: {
            owner?: string;
            ownerId?: string;
            rules?: Record<string, any>;
            sync?: boolean;
        };
    };
    comment?: string;
    genres?: Genre[];
    name: string;
    public?: boolean;
};

export type UpdatePlaylistQuery = {
    id: string;
};

export type UpdatePlaylistRequest = {
    body: UpdatePlaylistBody;
    query: UpdatePlaylistQuery;
    serverId?: string;
};

export type UpdatePlaylistResponse = null | undefined;

type PlaylistListSortMap = {
    jellyfin: Record<PlaylistListSort, JFPlaylistListSort | undefined>;
    navidrome: Record<PlaylistListSort, NDPlaylistListSort | undefined>;
    subsonic: Record<PlaylistListSort, undefined>;
};

export const playlistListSortMap: PlaylistListSortMap = {
    jellyfin: {
        duration: JFPlaylistListSort.DURATION,
        name: JFPlaylistListSort.NAME,
        owner: undefined,
        public: undefined,
        songCount: JFPlaylistListSort.SONG_COUNT,
        updatedAt: undefined,
    },
    navidrome: {
        duration: NDPlaylistListSort.DURATION,
        name: NDPlaylistListSort.NAME,
        owner: NDPlaylistListSort.OWNER,
        public: NDPlaylistListSort.PUBLIC,
        songCount: NDPlaylistListSort.SONG_COUNT,
        updatedAt: NDPlaylistListSort.UPDATED_AT,
    },
    subsonic: {
        duration: undefined,
        name: undefined,
        owner: undefined,
        public: undefined,
        songCount: undefined,
        updatedAt: undefined,
    },
};
export type MoveItemQuery = {
    endingIndex: number;
    playlistId: string;
    startingIndex: number;
    trackId: string;
};

export type MoveItemRequest = {
    query: MoveItemQuery;
};

export type PlaylistDetailQuery = {
    id: string;
};

export type PlaylistDetailRequest = { query: PlaylistDetailQuery };

export type PlaylistDetailResponse = Playlist;

export type PlaylistSongListQuery = {
    id: string;
    limit?: number;
    sortBy?: SongListSort;
    sortOrder?: ListSortOrder;
    startIndex: number;
};

export type PlaylistSongListRequest = { query: PlaylistSongListQuery };

export type PlaylistSongListResponse = BasePaginatedResponse<Song[]> | null | undefined;
