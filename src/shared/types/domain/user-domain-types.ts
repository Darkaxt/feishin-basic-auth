import i18n from '/@/i18n/i18n';
import {
    BasePaginatedQuery,
    BasePaginatedResponse,
} from '/@/shared/types/adapter/api-controller-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';

export enum UserListSortOptions {
    NAME = 'name',
}

export const UserListSortOptionsLabels = {
    [UserListSortOptions.NAME]: i18n.t('filter.name'),
};

export enum UserListSort {
    NAME = 'name',
}

export type DownloadQuery = {
    id: string;
};

export type DownloadRequest = { query: DownloadQuery };

export type ScrobbleQuery = {
    event?: 'pause' | 'start' | 'timeupdate' | 'unpause';
    id: string;
    position?: number;
    submission: boolean;
};

export type ScrobbleRequest = { query: ScrobbleQuery; serverId?: string };

export type ScrobbleResponse = null;

export type ShareItemBody = {
    description: string;
    downloadable: boolean;
    expires: number;
    resourceIds: string[];
    resourceType: string;
};

export type ShareItemRequest = { body: ShareItemBody; serverId?: string };

export type ShareItemResponse = null | { id: string; url: string };

export type User = {
    _itemType: LibraryItem.USER;
    _serverId: string;
    _serverType: ServerType;
    id: string;
    permissions: UserPermissions;
    username: string;
};

export interface UserListQuery extends BasePaginatedQuery<UserListSortOptions> {
    searchTerm?: string;
}

export type UserListRequest = { query: UserListQuery; totalRecordCount?: number };

export type UserListResponse = BasePaginatedResponse<User[]>;

export type UserPermissions = {
    'jukebox.manage': boolean; // Allow managing the jukebox
    'media.download': boolean; // Allow downloading media
    'media.folder': string[]; // Viewable folders
    'media.share': boolean; // Allow sharing media
    'media.stream': boolean; // Allow streaming media
    'media.upload': boolean; // Allow uploading media
    'playlist.create': boolean; // Allow creating playlists
    'playlist.delete': boolean; // Allow deleting playlists
    'playlist.edit': boolean; // Allow editing playlists
    'server.admin': boolean; // Allow managing the server (user management / server settings)
    'user.edit': boolean; // Allow editing own user account
};
