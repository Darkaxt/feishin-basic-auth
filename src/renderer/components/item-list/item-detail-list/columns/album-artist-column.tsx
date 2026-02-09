import { ItemDetailListCellProps } from './types';

export const AlbumArtistColumn = ({ song }: ItemDetailListCellProps) =>
    song.albumArtistName ?? '—';
