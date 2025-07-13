import i18n from '/@/i18n/i18n';
import { JFGenreListSort } from '/@/shared/api/jellyfin.types';
import { NDGenreListSort } from '/@/shared/api/navidrome.types';
import { BasePaginatedResponse, BaseQuery } from '/@/shared/types/adapter/api-controller-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';
import { UserListSort } from '/@/shared/types/domain/user-domain-types';

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

export interface GenreListQuery extends BaseQuery<GenreListSort> {
    _custom?: {
        jellyfin?: null;
        navidrome?: null;
    };
    limit?: number;
    musicFolderId?: string;
    searchTerm?: string;
    startIndex: number;
}

export type GenreListRequest = { query: GenreListQuery };

export type GenreListResponse = BasePaginatedResponse<Genre[]> | null | undefined;

export type RelatedGenre = {
    id: string;
    imageUrl: null | string;
    name: string;
};

type GenreListSortMap = {
    jellyfin: Record<GenreListSort, JFGenreListSort | undefined>;
    navidrome: Record<GenreListSort, NDGenreListSort | undefined>;
    subsonic: Record<UserListSort, undefined>;
};

export const genreListSortMap: GenreListSortMap = {
    jellyfin: {
        name: JFGenreListSort.NAME,
    },
    navidrome: {
        name: NDGenreListSort.NAME,
    },
    subsonic: {
        name: undefined,
    },
};
export enum GenreListSort {
    NAME = 'name',
}
