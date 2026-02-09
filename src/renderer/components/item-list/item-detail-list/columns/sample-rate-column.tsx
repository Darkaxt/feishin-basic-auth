import { ItemDetailListCellProps } from './types';

export const SampleRateColumn = ({ song }: ItemDetailListCellProps) =>
    song.sampleRate != null ? `${song.sampleRate} Hz` : '—';
