import { ItemDetailListCellProps } from './types';

export const TitleColumn = ({ song }: ItemDetailListCellProps) => song.name ?? <>&nbsp;</>;
