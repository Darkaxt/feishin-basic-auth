import { ItemDetailListCellProps } from './types';

export const GenreBadgeColumn = ({ song }: ItemDetailListCellProps) =>
    song.genres?.length ? song.genres.map((g) => g.name).join(', ') : <>&nbsp;</>;
