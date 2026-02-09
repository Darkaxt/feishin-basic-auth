import { TableColumn } from '/@/shared/types/types';

const FIXED_TRACK_COLUMN_WIDTHS: Partial<Record<TableColumn, number>> = {
    [TableColumn.ACTIONS]: 48,
    [TableColumn.TRACK_NUMBER]: 56,
    [TableColumn.USER_FAVORITE]: 48,
    [TableColumn.USER_RATING]: 76,
};

const HOVER_ONLY_COLUMNS: TableColumn[] = [
    TableColumn.ACTIONS,
    TableColumn.USER_FAVORITE,
    TableColumn.USER_RATING,
];

export function getTrackColumnFixed(columnId: TableColumn): {
    fixedWidth: number;
    isFixedColumn: boolean;
} {
    const width = FIXED_TRACK_COLUMN_WIDTHS[columnId];
    return width !== undefined
        ? { fixedWidth: width, isFixedColumn: true }
        : { fixedWidth: 0, isFixedColumn: false };
}

export function isTrackColumnHoverOnly(columnId: TableColumn): boolean {
    return HOVER_ONLY_COLUMNS.includes(columnId);
}

export function shouldShowHoverOnlyColumnContent(
    columnId: TableColumn,
    isRowHovered: boolean,
    song: { userFavorite?: boolean | null; userRating?: null | number },
): boolean {
    if (!HOVER_ONLY_COLUMNS.includes(columnId)) {
        return true;
    }

    return (
        isRowHovered ||
        (columnId === TableColumn.USER_FAVORITE && song.userFavorite !== false) ||
        (columnId === TableColumn.USER_RATING && song.userRating != null)
    );
}
