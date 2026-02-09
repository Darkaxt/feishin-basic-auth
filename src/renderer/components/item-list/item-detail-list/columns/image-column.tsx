import styles from './image-column.module.css';
import { ItemDetailListCellProps } from './types';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { LibraryItem } from '/@/shared/types/domain-types';

export const ImageColumn = ({ song }: ItemDetailListCellProps) => (
    <ItemImage
        className={styles.compactImage}
        containerClassName={styles.compactContainer}
        explicitStatus={song.explicitStatus}
        id={song.imageId}
        itemType={LibraryItem.SONG}
        serverId={song._serverId}
        type="table"
    />
);
