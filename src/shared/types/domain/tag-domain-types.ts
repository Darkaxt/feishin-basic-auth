import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';

export type Tag = {
    name: string;
    options: string[];
};

export type TagQuery = {
    folder?: string;
    type: LibraryItem.ALBUM | LibraryItem.SONG;
};

export type TagRequest = { query: TagQuery };

export type TagsResponse = {
    boolTags?: string[];
    enumTags?: Tag[];
};
