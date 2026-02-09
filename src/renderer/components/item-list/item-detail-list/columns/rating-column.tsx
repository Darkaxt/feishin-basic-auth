import { ItemDetailListCellProps } from './types';
import { ReadOnlyRating } from '/@/shared/components/read-only-rating/read-only-rating';

export const RatingColumn = ({ song }: ItemDetailListCellProps) => (
    <ReadOnlyRating size="md" value={song.userRating ?? undefined} />
);
