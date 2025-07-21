import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';

export type FavoriteQuery = {
    id: string[];
    type: LibraryItem;
};

export type FavoriteRequest = { query: FavoriteQuery; serverId?: string };

export type FavoriteResponse = null;

export type RatingQuery = {
    id: string[];
    rating: number;
};

export type RatingResponse = null;

export type SetRatingRequest = { query: RatingQuery; serverId?: string };
