import { ItemDetailListCellProps } from './types';

export const GenreColumn = ({ song }: ItemDetailListCellProps) =>
    song.genres?.length ? song.genres.map((g) => g.name).join(', ') : '—';
