import i18n from '/@/i18n/i18n';
import {
    BasePaginatedQuery,
    BasePaginatedResponse,
} from '/@/shared/types/adapter/api-controller-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';

export enum GenreListSortOptions {
    ALBUM_COUNT = 'albumCount',
    NAME = 'name',
    TRACK_COUNT = 'trackCount',
}

export const GenreListSortOptionsLabels = {
    [GenreListSortOptions.ALBUM_COUNT]: i18n.t('filter.albumCount'),
    [GenreListSortOptions.NAME]: i18n.t('filter.name'),
    [GenreListSortOptions.TRACK_COUNT]: i18n.t('filter.trackCount'),
};

export type Genre = {
    _itemType: LibraryItem.GENRE;
    _serverId: string;
    _serverType: ServerType;
    albumCount: null | number;
    id: string;
    imageUrl: null | string;
    name: string;
    songCount: null | number;
};

export interface GenreListQuery extends BasePaginatedQuery<GenreListSortOptions> {
    musicFolderId?: string;
    searchTerm?: string;
}

export type GenreListRequest = { query: GenreListQuery; totalRecordCount?: number };

export type GenreListResponse = BasePaginatedResponse<Genre[]> | null | undefined;

export type RelatedGenre = {
    id: string;
    imageUrl: null | string;
    name: string;
};
