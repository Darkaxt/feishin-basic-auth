import { ItemDetailListCellProps } from './types';
import { Icon } from '/@/shared/components/icon/icon';

export const FavoriteColumn = ({
    isMutatingFavorite,
    onFavoriteClick,
    song,
}: ItemDetailListCellProps) => (
    <div
        aria-disabled={isMutatingFavorite}
        onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onFavoriteClick?.(song);
        }}
        onDoubleClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
        }}
        role="button"
    >
        <Icon icon="favorite" size="xs" />
    </div>
);
