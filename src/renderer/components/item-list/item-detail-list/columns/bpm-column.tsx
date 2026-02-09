import { ItemDetailListCellProps } from './types';

export const BpmColumn = ({ song }: ItemDetailListCellProps) =>
    song.bpm != null ? String(song.bpm) : '—';
