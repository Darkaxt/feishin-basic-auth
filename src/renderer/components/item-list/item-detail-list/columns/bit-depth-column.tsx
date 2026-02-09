import { ItemDetailListCellProps } from './types';

export const BitDepthColumn = ({ song }: ItemDetailListCellProps) =>
    song.bitDepth != null ? String(song.bitDepth) : '—';
