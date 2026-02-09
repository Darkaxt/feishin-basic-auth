import { ItemDetailListCellProps } from './types';

export const TitleCombinedColumn = ({ song }: ItemDetailListCellProps) =>
    [song.name, song.artistName].filter(Boolean).join(' — ') ?? <>&nbsp;</>;
