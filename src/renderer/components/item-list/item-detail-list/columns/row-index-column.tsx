import { ItemDetailListCellProps } from './types';

export const RowIndexColumn = ({ rowIndex }: ItemDetailListCellProps) =>
    String((rowIndex ?? 0) + 1);
