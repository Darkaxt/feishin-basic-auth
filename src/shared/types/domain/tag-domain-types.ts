import { BaseEndpointArgs } from '/@/shared/types/domain/api-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';

export type Tag = {
    name: string;
    options: string[];
};

export type TagArgs = BaseEndpointArgs & {
    query: TagQuery;
};

export type TagQuery = {
    folder?: string;
    type: LibraryItem.ALBUM | LibraryItem.SONG;
};

export type TagsResponse = {
    boolTags?: string[];
    enumTags?: Tag[];
};
