import { ItemDetailListCellProps } from './types';
import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { LibraryItem } from '/@/shared/types/domain-types';

export const ImageColumn = ({ song }: ItemDetailListCellProps) =>
    song.imageId ? (
        <ItemImage id={song.imageId} itemType={LibraryItem.SONG} type="itemCard" />
    ) : (
        '—'
    );
