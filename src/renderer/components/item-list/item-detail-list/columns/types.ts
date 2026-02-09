import { Song } from '/@/shared/types/domain-types';

export interface ItemDetailListCellProps {
    isMutatingFavorite?: boolean;
    onFavoriteClick?: (song: Song) => void;
    rowIndex?: number;
    song: Song;
}
