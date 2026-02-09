import { ItemDetailListCellProps } from './types';

export const YearColumn = ({ song }: ItemDetailListCellProps) =>
    song.releaseYear != null ? String(song.releaseYear) : '—';
