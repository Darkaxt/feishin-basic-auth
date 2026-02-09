import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import throttle from 'lodash/throttle';
import { AnimatePresence } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
    Fragment,
    memo,
    type ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import { List, RowComponentProps, useDynamicRowHeight } from 'react-window-v2';

import styles from './item-detail.module.css';

import { ItemCardControls } from '/@/renderer/components/item-card/item-card-controls';
import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import {
    ItemListStateActions,
    ItemListStateItemWithRequiredProperties,
    useItemListState,
    useItemSelectionState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { parseTableColumns } from '/@/renderer/components/item-list/helpers/parse-table-columns';
import { getDetailListCellComponent } from '/@/renderer/components/item-list/item-detail-list/columns';
import {
    getTrackColumnFixed,
    isNoHorizontalPaddingColumn,
    shouldShowHoverOnlyColumnContent,
} from '/@/renderer/components/item-list/item-detail-list/utils';
import {
    pickTableColumns,
    SONG_TABLE_COLUMNS,
} from '/@/renderer/components/item-list/item-table-list/default-columns';
import { useItemDragDropState } from '/@/renderer/components/item-list/item-table-list/hooks/use-item-drag-drop-state';
import { columnLabelMap } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemControls, ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    JOINED_ARTISTS_MUTED_PROPS,
    JoinedArtists,
} from '/@/renderer/features/albums/components/joined-artists';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useIsMutatingCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useIsMutatingDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { AppRoute } from '/@/renderer/router/routes';
import { useSettingsStore, useShowRatings } from '/@/renderer/store';
import { formatDateAbsoluteUTC, formatDurationString } from '/@/renderer/utils';
import { ExplicitIndicator } from '/@/shared/components/explicit-indicator/explicit-indicator';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { Album, LibraryItem, Song } from '/@/shared/types/domain-types';
import { ItemListKey, TableColumn } from '/@/shared/types/types';

const DEFAULT_ROW_HEIGHT = 300;

const SKELETON_TRACK_ROW_COUNT = 6;

interface ItemDetailListProps {
    currentPage?: number;
    data?: unknown[];
    enableHeader?: boolean;
    getItem?: (index: number) => unknown;
    internalState?: ItemListStateActions;
    itemCount?: number;
    items?: unknown[];
    onRangeChanged?: (range: { startIndex: number; stopIndex: number }) => Promise<void> | void;
    rowHeight?: number;
}

interface RowData {
    columnWidthPercents: number[];
    controls?: ItemControls;
    data: unknown[];
    defaultRowHeight: number;
    enableAlternateRowColors: boolean;
    enableHorizontalBorders: boolean;
    enableRowHoverHighlight: boolean;
    enableVerticalBorders: boolean;
    getItem?: (index: number) => unknown;
    internalState: ItemListStateActions;
    isMutatingFavorite: boolean;
    registerSongs: (albumId: string, songs: Song[]) => void;
    trackColumns: ItemTableListColumnConfig[];
    trackTableSize: 'compact' | 'default' | 'large';
}

interface TrackRowProps {
    columns: ItemTableListColumnConfig[];
    columnWidthPercents: number[];
    controls?: ItemControls;
    enableAlternateRowColors: boolean;
    enableHorizontalBorders: boolean;
    enableRowHoverHighlight: boolean;
    enableVerticalBorders: boolean;
    internalState: ItemListStateActions;
    isMutatingFavorite: boolean;
    isSongsLoading?: boolean;
    rowIndex: number;
    size: 'compact' | 'default' | 'large';
    song: Song;
}

const textAlignFromAlign = (align: ItemTableListColumnConfig['align']) =>
    align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';

const TrackRow = memo(
    ({
        columns,
        columnWidthPercents,
        controls,
        enableAlternateRowColors,
        enableHorizontalBorders,
        enableRowHoverHighlight,
        enableVerticalBorders,
        internalState,
        isMutatingFavorite,
        isSongsLoading,
        rowIndex,
        size,
        song,
    }: TrackRowProps) => {
        const playerContext = usePlayer();
        const { dragRef, isDragging } = useItemDragDropState<HTMLDivElement>({
            enableDrag: true,
            internalState,
            isDataRow: true,
            item: song,
            itemType: LibraryItem.SONG,
            playerContext,
        });
        const [isRowHovered, setIsRowHovered] = useState(false);
        const isSelected = useItemSelectionState(internalState, song.id);

        const handleRowClick = useCallback(
            (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey) {
                    internalState.toggleSelected(song);
                } else if (e.shiftKey) {
                    const selectedItems = internalState.getSelected();
                    const lastSelectedItem = selectedItems[selectedItems.length - 1];

                    if (
                        lastSelectedItem &&
                        typeof lastSelectedItem === 'object' &&
                        lastSelectedItem !== null
                    ) {
                        const data = internalState.getData();
                        const validData = data.filter((d) => d && typeof d === 'object');
                        const lastRowId = internalState.extractRowId(lastSelectedItem);
                        if (!lastRowId) {
                            internalState.setSelected([song]);
                            return;
                        }
                        const lastIndex = internalState.findItemIndex(lastRowId);
                        const currentIndex = internalState.findItemIndex(song.id);

                        if (lastIndex !== -1 && currentIndex !== -1) {
                            const startIndex = Math.min(lastIndex, currentIndex);
                            const stopIndex = Math.max(lastIndex, currentIndex);
                            const rangeItems: ItemListStateItemWithRequiredProperties[] = [];
                            for (let i = startIndex; i <= stopIndex; i++) {
                                const rangeItem = validData[i];
                                if (
                                    rangeItem &&
                                    typeof rangeItem === 'object' &&
                                    '_serverId' in rangeItem &&
                                    '_itemType' in rangeItem
                                ) {
                                    const rangeRowId = internalState.extractRowId(rangeItem);
                                    if (rangeRowId) {
                                        rangeItems.push(
                                            rangeItem as ItemListStateItemWithRequiredProperties,
                                        );
                                    }
                                }
                            }
                            const currentSelected = internalState.getSelected();
                            const newSelected = [
                                ...currentSelected.filter(
                                    (
                                        selectedItem,
                                    ): selectedItem is ItemListStateItemWithRequiredProperties =>
                                        typeof selectedItem === 'object' && selectedItem !== null,
                                ),
                            ];
                            rangeItems.forEach((rangeItem) => {
                                const rangeRowId = internalState.extractRowId(rangeItem);
                                if (
                                    rangeRowId &&
                                    !newSelected.some(
                                        (selected) =>
                                            internalState.extractRowId(selected) === rangeRowId,
                                    )
                                ) {
                                    newSelected.push(rangeItem);
                                }
                            });
                            internalState.setSelected(newSelected);
                        } else {
                            internalState.setSelected([song]);
                        }
                    } else {
                        internalState.setSelected([song]);
                    }
                } else {
                    const selected = internalState.getSelected();
                    const onlyThisSelected =
                        selected.length === 1 &&
                        internalState.extractRowId(selected[0]) === song.id;
                    internalState.setSelected(onlyThisSelected ? [] : [song]);
                }
            },
            [internalState, song],
        );

        const handleContextMenu = useCallback(
            (event: React.MouseEvent<HTMLDivElement>) => {
                if (isSongsLoading || !controls?.onMore) return;
                event.preventDefault();
                const index = internalState.findItemIndex(song.id);
                controls.onMore({
                    event,
                    index,
                    internalState,
                    item: song,
                    itemType: LibraryItem.SONG,
                });
            },
            [controls, internalState, isSongsLoading, song],
        );

        return (
            <div
                className={clsx(styles.trackRow, {
                    [styles.trackRowAlternateEven]: enableAlternateRowColors && rowIndex % 2 === 0,
                    [styles.trackRowAlternateOdd]: enableAlternateRowColors && rowIndex % 2 === 1,
                    [styles.trackRowDragging]: isDragging,
                    [styles.trackRowHorizontalBorderVisible]:
                        enableHorizontalBorders && rowIndex > 0,
                    [styles.trackRowHoverHighlightEnabled]: enableRowHoverHighlight,
                    [styles.trackRowSelected]: isSelected,
                    [styles.trackRowSizeCompact]: size === 'compact',
                    [styles.trackRowSizeDefault]: size === 'default',
                    [styles.trackRowSizeLarge]: size === 'large',
                    [styles.trackRowWithHorizontalBorder]: rowIndex > 0,
                })}
                onClick={handleRowClick}
                onContextMenu={handleContextMenu}
                onMouseEnter={() => setIsRowHovered(true)}
                onMouseLeave={() => setIsRowHovered(false)}
                ref={dragRef ?? undefined}
                role="row"
            >
                {columns.map((col, colIndex) => {
                    const percent = columnWidthPercents[colIndex] ?? 0;
                    const { fixedWidth, isFixedColumn } = getTrackColumnFixed(col.id);
                    const style: React.CSSProperties = {
                        flex: isFixedColumn ? `0 0 ${fixedWidth}px` : `${percent} 1 0`,
                        fontFamily:
                            col.id === TableColumn.DURATION || col.id === TableColumn.TRACK_NUMBER
                                ? 'monospace'
                                : undefined,
                        minWidth: isFixedColumn ? fixedWidth : 0,
                        textAlign: textAlignFromAlign(col.align),
                    };
                    const CellComponent = getDetailListCellComponent(col.id);
                    const isTitleColumn = col.id === TableColumn.TITLE;
                    const isImageColumn = col.id === TableColumn.IMAGE;
                    const isIconActionColumn = isNoHorizontalPaddingColumn(col.id);
                    const showHoverContent = shouldShowHoverOnlyColumnContent(
                        col.id,
                        isRowHovered,
                        song,
                    );

                    const content = isSongsLoading ? null : showHoverContent ? (
                        <CellComponent
                            columnId={col.id}
                            controls={controls}
                            internalState={internalState}
                            isMutatingFavorite={isMutatingFavorite}
                            isRowHovered={isRowHovered}
                            rowIndex={rowIndex}
                            size={size}
                            song={song}
                        />
                    ) : (
                        '\u00A0'
                    );

                    const isLastColumn = colIndex === columns.length - 1;
                    return (
                        <div
                            className={clsx(styles.trackCell, {
                                [styles.trackCellImage]: isImageColumn,
                                [styles.trackCellMuted]: !isTitleColumn,
                                [styles.trackCellNoHPadding]: isIconActionColumn,
                                [styles.trackCellVerticalBorderVisible]:
                                    enableVerticalBorders && !isLastColumn,
                                [styles.trackCellWithVerticalBorder]: !isLastColumn,
                            })}
                            key={col.id}
                            role="cell"
                            style={style}
                        >
                            {content}
                        </div>
                    );
                })}
            </div>
        );
    },
);

TrackRow.displayName = 'TrackRow';

interface MetadataSectionProps {
    controls?: ItemControls;
    internalState: ItemListStateActions;
    item: Album;
}

const MetadataSection = memo(
    ({ controls, internalState, item }: MetadataSectionProps) => {
        const { t } = useTranslation();
        const showRatings = useShowRatings();
        const [isImageHovered, setIsImageHovered] = useState(false);
        const [isMetadataHovered, setIsMetadataHovered] = useState(false);

        const isFavorite = item.userFavorite ?? false;
        const userRating = item.userRating ?? null;
        const hasRating = showRatings && userRating !== null && userRating > 0;

        const metadataExtra = useMemo(() => {
            const parts: Array<{ content: React.ReactNode; key: string }> = [];
            const releaseStr =
                (item.releaseDate && formatDateAbsoluteUTC(item.releaseDate)) ||
                (item.releaseYear != null ? String(item.releaseYear) : '');
            if (releaseStr) parts.push({ content: releaseStr, key: 'release' });
            const genres = item.genres?.filter((g) => g.name) ?? [];
            if (genres.length > 0) {
                parts.push({
                    content: genres.map((genre, i) => (
                        <Fragment key={genre.id}>
                            {i > 0 && ', '}
                            <Link
                                className={styles.metadataLink}
                                to={generatePath(AppRoute.LIBRARY_GENRES_DETAIL, {
                                    genreId: genre.id,
                                })}
                            >
                                {genre.name}
                            </Link>
                        </Fragment>
                    )),
                    key: 'genres',
                });
            }
            const songCount = item.songCount ?? 0;
            const duration = item.duration ?? 0;
            const tracksAndDurationParts: string[] = [];
            if (songCount > 0) {
                tracksAndDurationParts.push(t('entity.trackWithCount', { count: songCount }));
            }
            if (duration > 0) {
                tracksAndDurationParts.push(formatDurationString(duration));
            }
            const tracksAndDuration = tracksAndDurationParts.join(' · ');
            if (tracksAndDuration) {
                parts.push({ content: tracksAndDuration, key: 'tracks' });
            }
            return parts.length > 0 ? parts : null;
        }, [item, t]);

        const hasArtist =
            (item.albumArtistName?.trim()?.length ?? 0) > 0 || (item.albumArtists?.length ?? 0) > 0;

        return (
            <div
                className={styles.metadata}
                onMouseEnter={() => setIsMetadataHovered(true)}
                onMouseLeave={() => setIsMetadataHovered(false)}
            >
                <Link
                    className={styles.imageWrapper}
                    onMouseEnter={() => setIsImageHovered(true)}
                    onMouseLeave={() => setIsImageHovered(false)}
                    state={{ item }}
                    to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                        albumId: item.id,
                    })}
                >
                    <ItemImage
                        className={styles.image}
                        explicitStatus={item.explicitStatus}
                        id={item.imageId}
                        itemType={item._itemType}
                        serverId={item._serverId}
                        type="itemCard"
                    />
                    {isFavorite && <div className={styles.favoriteBadge} />}
                    {hasRating && <div className={styles.ratingBadge}>{userRating}</div>}
                    <AnimatePresence>
                        {controls && isImageHovered && (
                            <ItemCardControls
                                controls={controls}
                                enableExpansion={false}
                                internalState={internalState}
                                item={item}
                                itemType={item._itemType}
                                showRating={true}
                                type="compact"
                            />
                        )}
                    </AnimatePresence>
                </Link>
                <Link
                    className={styles.title}
                    state={{ item }}
                    to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                        albumId: item.id,
                    })}
                >
                    <ExplicitIndicator explicitStatus={item.explicitStatus} />
                    {item.name}
                </Link>
                <div className={styles.artist}>
                    {!hasArtist ? (
                        <>&nbsp;</>
                    ) : !isMetadataHovered ? (
                        <Text className={styles.artistPlainText} component="span" isMuted size="sm">
                            {item.albumArtistName ?? ''}
                        </Text>
                    ) : (
                        <JoinedArtists
                            artistName={item.albumArtistName ?? ''}
                            artists={item.albumArtists ?? []}
                            linkProps={JOINED_ARTISTS_MUTED_PROPS.linkProps}
                            rootTextProps={JOINED_ARTISTS_MUTED_PROPS.rootTextProps}
                        />
                    )}
                </div>
                {metadataExtra && metadataExtra.length > 0 && (
                    <div className={styles.metadataExtra}>
                        {metadataExtra.map((part) => (
                            <div
                                className={clsx(styles.metadataLine, {
                                    [styles.metadataLineClamp2]: part.key === 'genres',
                                })}
                                key={part.key}
                            >
                                {part.content}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    },
    (prev, next) => prev.item === next.item,
);

MetadataSection.displayName = 'MetadataSection';

interface ItemDetailSkeletonRowProps {
    defaultRowHeight: number;
    enableAlternateRowColors: boolean;
    enableHorizontalBorders: boolean;
    enableVerticalBorders: boolean;
    trackTableSize: 'compact' | 'default' | 'large';
}

const ItemDetailSkeletonRow = memo(
    ({
        defaultRowHeight,
        enableAlternateRowColors,
        enableHorizontalBorders,
        enableVerticalBorders,
        trackTableSize,
    }: ItemDetailSkeletonRowProps) => {
        const heightStyle = {
            height: defaultRowHeight,
            minHeight: defaultRowHeight,
            overflow: 'hidden' as const,
        };
        return (
            <>
                <div className={styles.skeletonColumnWrapper} style={heightStyle}>
                    <div className={styles.left}>
                        <div className={styles.metadata}>
                            <Skeleton
                                className={styles.skeletonImage}
                                containerClassName={styles.skeletonImageContainer}
                            />
                            <Skeleton
                                className={styles.skeletonTitle}
                                containerClassName={styles.skeletonTitleContainer}
                            />
                            <Skeleton
                                className={styles.skeletonArtist}
                                containerClassName={styles.skeletonArtistContainer}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.skeletonColumnWrapper} style={heightStyle}>
                    <div className={styles.right}>
                        <div className={styles.tracksTable} role="table">
                            {Array.from({ length: SKELETON_TRACK_ROW_COUNT }).map((_, i) => (
                                <div
                                    className={clsx(styles.trackRow, {
                                        [styles.trackRowAlternateEven]:
                                            enableAlternateRowColors && i % 2 === 0,
                                        [styles.trackRowAlternateOdd]:
                                            enableAlternateRowColors && i % 2 === 1,
                                        [styles.trackRowHorizontalBorderVisible]:
                                            enableHorizontalBorders && i > 0,
                                        [styles.trackRowSizeCompact]: trackTableSize === 'compact',
                                        [styles.trackRowSizeDefault]: trackTableSize === 'default',
                                        [styles.trackRowSizeLarge]: trackTableSize === 'large',
                                        [styles.trackRowWithHorizontalBorder]: i > 0,
                                    })}
                                    key={i}
                                    role="row"
                                >
                                    <div
                                        className={clsx(styles.trackCell, {
                                            [styles.trackCellVerticalBorderVisible]:
                                                enableVerticalBorders,
                                            [styles.trackCellWithVerticalBorder]: true,
                                        })}
                                        role="cell"
                                        style={{ flex: 1, minWidth: 0 }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    },
);

ItemDetailSkeletonRow.displayName = 'ItemDetailSkeletonRow';

type RowContentProps = Omit<RowComponentProps<RowData>, 'style'>;

const RowContent = memo(
    ({
        columnWidthPercents,
        controls,
        data,
        defaultRowHeight,
        enableAlternateRowColors,
        enableHorizontalBorders,
        enableRowHoverHighlight,
        enableVerticalBorders,
        getItem,
        index,
        internalState,
        isMutatingFavorite,
        registerSongs,
        trackColumns,
        trackTableSize,
    }: RowContentProps) => {
        const item = useMemo(() => {
            if (getItem) {
                return getItem(index) as Album | undefined;
            }

            return (data?.[index] as Album | undefined) || undefined;
        }, [data, getItem, index]);

        const { data: songData, isLoading: isSongsQueryLoading } = useQuery({
            enabled: !!item && !!item.id,
            ...albumQueries.detail({
                query: {
                    id: item?.id || '',
                },
                serverId: item?._serverId || '',
            }),
        });

        const isSongsLoading = !!item && isSongsQueryLoading && !songData;

        const songs = useMemo(() => {
            return (
                songData?.songs ||
                Array.from({ length: item?.songCount || 0 }, (_, i) => ({
                    duration: 0,
                    id: `${item?.id}-${i}`,
                    name: '',
                    trackNumber: i + 1,
                }))
            );
        }, [songData, item?.id, item?.songCount]);

        useEffect(() => {
            if (item?.id && songData?.songs?.length) {
                registerSongs(item.id, songData.songs as Song[]);
            }
        }, [item?.id, registerSongs, songData?.songs]);

        if (!item) {
            return (
                <ItemDetailSkeletonRow
                    defaultRowHeight={defaultRowHeight}
                    enableAlternateRowColors={enableAlternateRowColors}
                    enableHorizontalBorders={enableHorizontalBorders}
                    enableVerticalBorders={enableVerticalBorders}
                    trackTableSize={trackTableSize}
                />
            );
        }

        return (
            <>
                <div className={styles.left}>
                    <MetadataSection
                        controls={controls}
                        internalState={internalState}
                        item={item}
                    />
                </div>

                <div className={styles.right}>
                    <div className={styles.tracksTable} role="table">
                        {songs.map((song, rowIndex) => (
                            <TrackRow
                                columns={trackColumns}
                                columnWidthPercents={columnWidthPercents}
                                controls={controls}
                                enableAlternateRowColors={enableAlternateRowColors}
                                enableHorizontalBorders={enableHorizontalBorders}
                                enableRowHoverHighlight={enableRowHoverHighlight}
                                enableVerticalBorders={enableVerticalBorders}
                                internalState={internalState}
                                isMutatingFavorite={isMutatingFavorite}
                                isSongsLoading={isSongsLoading}
                                key={song.id}
                                rowIndex={rowIndex}
                                size={trackTableSize}
                                song={song as Song}
                            />
                        ))}
                    </div>
                </div>
            </>
        );
    },
    (prev, next) =>
        prev.index === next.index &&
        prev.data === next.data &&
        prev.columnWidthPercents === next.columnWidthPercents &&
        prev.defaultRowHeight === next.defaultRowHeight &&
        prev.enableAlternateRowColors === next.enableAlternateRowColors &&
        prev.enableHorizontalBorders === next.enableHorizontalBorders &&
        prev.enableRowHoverHighlight === next.enableRowHoverHighlight &&
        prev.enableVerticalBorders === next.enableVerticalBorders &&
        prev.getItem === next.getItem &&
        prev.internalState === next.internalState &&
        prev.isMutatingFavorite === next.isMutatingFavorite &&
        prev.controls === next.controls &&
        prev.registerSongs === next.registerSongs &&
        prev.trackColumns === next.trackColumns &&
        prev.trackTableSize === next.trackTableSize,
);

RowContent.displayName = 'RowContent';

const RowComponent = memo((props: RowComponentProps<RowData>): ReactElement => {
    const { style, ...rowContentProps } = props;
    return (
        <div className={styles.row} style={style}>
            <RowContent {...rowContentProps} />
        </div>
    );
});

RowComponent.displayName = 'ItemDetailRow';

interface DetailListHeaderProps {
    columnWidthPercents: number[];
    enableVerticalBorders: boolean;
    headerLeftRef: React.RefObject<HTMLSpanElement | null>;
    trackColumns: ItemTableListColumnConfig[];
    trackTableSize: 'compact' | 'default' | 'large';
}

const colTypeToAlignMap = {
    center: 'center',
    end: 'right',
    start: 'left',
};

const colTypeToJustifyContentMap = {
    center: 'center',
    end: 'flex-end',
    start: 'flex-start',
};

const DetailListHeader = memo(
    ({
        columnWidthPercents,
        enableVerticalBorders,
        headerLeftRef,
        trackColumns,
        trackTableSize,
    }: DetailListHeaderProps) => {
        return (
            <header className={styles.detailListHeader} role="rowgroup">
                <div className={styles.headerLeft}>
                    <span
                        className={styles.headerLeftAlbumName}
                        data-title=""
                        ref={headerLeftRef}
                    />
                </div>
                <div className={styles.headerRight}>
                    <div
                        className={clsx(styles.tracksTableHeader, {
                            [styles.tracksTableHeaderSizeCompact]: trackTableSize === 'compact',
                            [styles.tracksTableHeaderSizeDefault]: trackTableSize === 'default',
                            [styles.tracksTableHeaderSizeLarge]: trackTableSize === 'large',
                        })}
                        role="row"
                    >
                        {trackColumns.map((col, colIndex) => {
                            const percent = columnWidthPercents[colIndex] ?? 0;
                            const { fixedWidth, isFixedColumn } = getTrackColumnFixed(col.id);
                            const isLastColumn = colIndex === trackColumns.length - 1;

                            const style: React.CSSProperties = {
                                flex: isFixedColumn ? `0 0 ${fixedWidth}px` : `${percent} 1 0`,
                                justifyContent: colTypeToJustifyContentMap[col.align],
                                minWidth: isFixedColumn ? fixedWidth : 0,
                                textAlign: colTypeToAlignMap[col.align] as
                                    | 'center'
                                    | 'left'
                                    | 'right',
                            };

                            return (
                                <div
                                    className={clsx(styles.trackHeaderCell, {
                                        [styles.trackHeaderCellNoHPadding]:
                                            isNoHorizontalPaddingColumn(col.id),
                                        [styles.trackHeaderCellWithVerticalBorder]:
                                            enableVerticalBorders && !isLastColumn,
                                    })}
                                    key={col.id}
                                    role="columnheader"
                                    style={style}
                                >
                                    {columnLabelMap[col.id] ?? ''}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </header>
        );
    },
);

DetailListHeader.displayName = 'DetailListHeader';

export const ItemDetailList = ({
    currentPage,
    data,
    enableHeader = true,
    getItem,
    itemCount: externalItemCount,
    items,
    onRangeChanged,
}: ItemDetailListProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const controls = useDefaultItemListControls();
    const isMutatingCreateFavorite = useIsMutatingCreateFavorite();
    const isMutatingDeleteFavorite = useIsMutatingDeleteFavorite();
    const isMutatingFavorite = isMutatingCreateFavorite || isMutatingDeleteFavorite;

    const rowHeight = useDynamicRowHeight({
        defaultRowHeight: DEFAULT_ROW_HEIGHT,
    });

    const isInfinite = data !== undefined || getItem !== undefined;
    const isPaginated = items !== undefined || currentPage !== undefined;

    const dataSource = useMemo(() => {
        if (isInfinite && data) {
            return data;
        }
        if (isPaginated && items) {
            return items;
        }
        return [];
    }, [data, isInfinite, isPaginated, items]);

    const itemCount = useMemo(() => {
        if (externalItemCount !== undefined) {
            return externalItemCount;
        }
        return dataSource.length;
    }, [dataSource.length, externalItemCount]);

    // Accumulate songs from each row for selection/drag state (keyed by album id)
    const songsByAlbumRef = useRef<Map<string, Song[]>>(new Map());
    const registerSongs = useCallback((albumId: string, songs: Song[]) => {
        songsByAlbumRef.current.set(albumId, songs);
    }, []);

    // Flattened songs in album order for ItemListState (selection/drag are per-song)
    const getDataFn = useCallback(() => {
        const map = songsByAlbumRef.current;
        return dataSource.flatMap((album) => map.get((album as Album).id) ?? []);
    }, [dataSource]);

    const extractRowIdSong = useCallback((item: unknown) => (item as Song).id, []);

    const internalState = useItemListState(getDataFn, extractRowIdSong);

    const tableConfig = useSettingsStore((state) => state.lists[ItemListKey.ALBUM]?.detail);
    const trackColumns = useMemo((): ItemTableListColumnConfig[] => {
        const raw = tableConfig?.columns;
        if (raw && raw.length > 0) {
            return parseTableColumns(raw);
        }
        return pickTableColumns({
            columns: SONG_TABLE_COLUMNS,
            enabledColumns: [
                TableColumn.TRACK_NUMBER,
                TableColumn.TITLE,
                TableColumn.DURATION,
                TableColumn.USER_FAVORITE,
                TableColumn.USER_RATING,
            ],
        });
    }, [tableConfig?.columns]);
    const trackTableSize = tableConfig?.size ?? 'default';
    const enableRowHoverHighlight = tableConfig?.enableRowHoverHighlight ?? true;
    const enableAlternateRowColors = tableConfig?.enableAlternateRowColors ?? false;
    const enableHorizontalBorders = tableConfig?.enableHorizontalBorders ?? false;
    const enableVerticalBorders = tableConfig?.enableVerticalBorders ?? false;

    const columnWidthPercents = useMemo(() => {
        const total = trackColumns.reduce((sum, c) => sum + c.width, 0);
        if (total <= 0) {
            return trackColumns.map(() => 100 / Math.max(1, trackColumns.length));
        }
        return trackColumns.map((c) => (c.width / total) * 100);
    }, [trackColumns]);

    const headerLeftRef = useRef<HTMLSpanElement>(null);
    const dataSourceRef = useRef(dataSource);
    dataSourceRef.current = dataSource;
    const lastHeaderNameRef = useRef('');

    const handleRowsRendered = useCallback(
        (range: { startIndex: number; stopIndex: number }) => {
            const el = headerLeftRef.current;
            if (el) {
                const album = getItem?.(range.startIndex) as Album | undefined;
                const name = album?.name ?? '';
                if (name) {
                    lastHeaderNameRef.current = name;
                    el.textContent = name;
                    el.setAttribute('data-title', name);
                    el.title = name;
                } else {
                    el.textContent = lastHeaderNameRef.current;
                    el.setAttribute('data-title', lastHeaderNameRef.current);
                    el.title = lastHeaderNameRef.current;
                }
            }
            if (onRangeChanged) {
                onRangeChanged(range);
            }
        },
        [getItem, onRangeChanged],
    );

    const throttledHandleRowsRendered = useMemo(
        () =>
            throttle(handleRowsRendered, 150, {
                leading: true,
                trailing: true,
            }),
        [handleRowsRendered],
    );

    useEffect(() => {
        return () => {
            throttledHandleRowsRendered.cancel();
        };
    }, [throttledHandleRowsRendered]);

    const rowProps = useMemo<RowData>(
        () => ({
            columnWidthPercents,
            controls,
            data: dataSource,
            defaultRowHeight: DEFAULT_ROW_HEIGHT,
            enableAlternateRowColors,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableVerticalBorders,
            getItem,
            internalState,
            isMutatingFavorite,
            queryClient,
            registerSongs,
            trackColumns,
            trackTableSize,
        }),
        [
            columnWidthPercents,
            controls,
            dataSource,
            enableAlternateRowColors,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableVerticalBorders,
            getItem,
            internalState,
            isMutatingFavorite,
            queryClient,
            registerSongs,
            trackColumns,
            trackTableSize,
        ],
    );

    const [initialize, osInstance] = useOverlayScrollbars({
        defer: false,
        events: {
            initialized(osInstance) {
                const { viewport } = osInstance.elements();
                viewport.style.overflowX = `var(--os-viewport-overflow-x)`;
            },
        },
        options: {
            overflow: { x: 'hidden', y: 'scroll' },
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
                visibility: 'visible',
            },
        },
    });

    useEffect(() => {
        const { current: container } = containerRef;

        if (!container || !container.firstElementChild) {
            return;
        }

        const viewport = container.firstElementChild as HTMLElement;

        initialize({
            elements: { viewport },
            target: container,
        });

        return () => osInstance()?.destroy();
    }, [initialize, osInstance]);

    return (
        <div className={styles.wrapper}>
            {enableHeader && (
                <DetailListHeader
                    columnWidthPercents={columnWidthPercents}
                    enableVerticalBorders={enableVerticalBorders}
                    headerLeftRef={headerLeftRef}
                    trackColumns={trackColumns}
                    trackTableSize={trackTableSize}
                />
            )}
            <div className={styles.container} ref={containerRef}>
                <List
                    onRowsRendered={throttledHandleRowsRendered}
                    rowComponent={
                        RowComponent as (props: RowComponentProps<RowData>) => ReactElement
                    }
                    rowCount={itemCount}
                    rowHeight={rowHeight}
                    rowProps={rowProps}
                />
            </div>
        </div>
    );
};
