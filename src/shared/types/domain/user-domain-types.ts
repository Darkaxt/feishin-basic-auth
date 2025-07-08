import i18n from '/@/i18n/i18n';
import { NDUserListSort } from '/@/shared/api/navidrome.types';
import {
    BaseEndpointArgs,
    BasePaginatedResponse,
    BaseQuery,
} from '/@/shared/types/domain/api-domain-types';
import { AnyLibraryItems, LibraryItem } from '/@/shared/types/domain/shared-domain-types';

export enum UserListSortOptions {
    CREATED_AT = 'createdAt',
    EMAIL = 'email',
    NAME = 'name',
    UPDATED_AT = 'updatedAt',
}

export const UserListSortOptionsLabels = {
    [UserListSortOptions.CREATED_AT]: i18n.t('filter.createdAt'),
    [UserListSortOptions.EMAIL]: i18n.t('filter.email'),
    [UserListSortOptions.NAME]: i18n.t('filter.name'),
    [UserListSortOptions.UPDATED_AT]: i18n.t('filter.updatedAt'),
};

export type FavoriteArgs = BaseEndpointArgs & { query: FavoriteQuery; serverId?: string };

export type FavoriteQuery = {
    id: string[];
    type: LibraryItem;
};

export type FavoriteResponse = null | undefined;
export type RatingQuery = {
    item: AnyLibraryItems;
    rating: number;
};

export type RatingResponse = null | undefined;

export type SetRatingArgs = BaseEndpointArgs & { query: RatingQuery; serverId?: string };

export type UserListArgs = BaseEndpointArgs & { query: UserListQuery };

export interface UserListQuery extends BaseQuery<UserListSort> {
    _custom?: {
        navidrome?: {
            owner_id?: string;
        };
    };
    limit?: number;
    searchTerm?: string;
    startIndex: number;
}

export type UserListResponse = BasePaginatedResponse<User[]> | null | undefined;

type UserListSortMap = {
    jellyfin: Record<UserListSort, undefined>;
    navidrome: Record<UserListSort, NDUserListSort | undefined>;
    subsonic: Record<UserListSort, undefined>;
};

export const userListSortMap: UserListSortMap = {
    jellyfin: {
        name: undefined,
    },
    navidrome: {
        name: NDUserListSort.NAME,
    },
    subsonic: {
        name: undefined,
    },
};

export enum UserListSort {
    NAME = 'name',
}

export type DownloadArgs = BaseEndpointArgs & {
    query: DownloadQuery;
};

export type DownloadQuery = {
    id: string;
};

export type ScrobbleArgs = BaseEndpointArgs & {
    query: ScrobbleQuery;
    serverId?: string;
};

export type ScrobbleQuery = {
    event?: 'pause' | 'start' | 'timeupdate' | 'unpause';
    id: string;
    position?: number;
    submission: boolean;
};

export type ScrobbleResponse = null | undefined;

export type ShareItemArgs = BaseEndpointArgs & { body: ShareItemBody; serverId?: string };

export type ShareItemBody = {
    description: string;
    downloadable: boolean;
    expires: number;
    resourceIds: string;
    resourceType: string;
};

export type ShareItemResponse = undefined | { id: string };

export type User = {
    createdAt: null | string;
    email: null | string;
    id: string;
    isAdmin: boolean | null;
    lastLoginAt: null | string;
    name: string;
    updatedAt: null | string;
};
