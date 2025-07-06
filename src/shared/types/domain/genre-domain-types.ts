import i18n from 'src/i18n/i18n';

import { UserListSort } from './user-domain-types';

import { JFGenreListSort } from '/@/shared/api/jellyfin.types';
import { NDGenreListSort } from '/@/shared/api/navidrome.types';
import {
    BaseEndpointArgs,
    BasePaginatedResponse,
    BaseQuery,
    LibraryItem,
} from '/@/shared/types/domain-types';

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
    albumCount?: number;
    id: string;
    imageUrl: null | string;
    itemType: LibraryItem.GENRE;
    name: string;
    songCount?: number;
};

export type GenreListArgs = BaseEndpointArgs & { query: GenreListQuery };

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
// Genre List

export type GenreListResponse = BasePaginatedResponse<Genre[]> | null | undefined;

export type GenresResponse = Genre[];
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
