import { ItemDetailListCellProps } from './types';

export const TitleArtistColumn = ({ song }: ItemDetailListCellProps) =>
    [song.name, song.artistName].filter(Boolean).join(' — ') || '—';
