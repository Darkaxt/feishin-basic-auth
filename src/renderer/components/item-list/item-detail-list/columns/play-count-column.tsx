import { ItemDetailListCellProps } from './types';

export const PlayCountColumn = ({ song }: ItemDetailListCellProps) =>
    String(song.playCount ?? 0);
