import { ItemDetailListCellProps } from './types';

export const ArtistColumn = ({ song }: ItemDetailListCellProps) => song.artistName ?? <>&nbsp;</>;
