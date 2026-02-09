import { useQuery, useQueryClient } from '@tanstack/react-query';
import formatDuration from 'format-duration';
import throttle from 'lodash/throttle';
import { AnimatePresence } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { memo, type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useItemDragDropState } from '/@/renderer/components/item-list/item-table-list/hooks/use-item-drag-drop-state';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useIsMutatingCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useIsMutatingDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { AppRoute } from '/@/renderer/router/routes';
import { Icon } from '/@/shared/components/icon/icon';
import { ReadOnlyRating } from '/@/shared/components/read-only-rating/read-only-rating';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Album, LibraryItem, Song } from '/@/shared/types/domain-types';

interface ItemDetailListProps {
    currentPage?: number;
    data?: unknown[];
    dataVersion?: number;
    getItem?: (index: number) => unknown;
    internalState?: ItemListStateActions;
    itemCount?: number;
    items?: unknown[];
    onRangeChanged?: (range: { startIndex: number; stopIndex: number }) => Promise<void> | void;
    rowHeight?: number;
}

interface RowData {
    controls?: ItemControls;
    data: unknown[];
    getItem?: (index: number) => unknown;
    internalState: ItemListStateActions;
    isMutatingFavorite: boolean;
    queryClient: ReturnType<typeof useQueryClient>;
    registerSongs: (albumId: string, songs: Song[]) => void;
}

interface TrackRowProps {
    internalState: ItemListStateActions;
    isMutatingFavorite: boolean;
    onFavoriteClick: (song: Song) => void;
    song: Song;
}

const TrackRow = memo(
    ({ internalState, isMutatingFavorite, onFavoriteClick, song }: TrackRowProps) => {
        const playerContext = usePlayer();
        const { dragRef, isDragging } = useItemDragDropState<HTMLTableRowElement>({
            enableDrag: true,
            internalState,
            isDataRow: true,
            item: song,
            itemType: LibraryItem.SONG,
            playerContext,
        });
        const discAndCol =
            `${song.discNumber ?? 1}` + ' - ' + song.trackNumber.toString().padStart(2, '0');
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
                    internalState.setSelected([song]);
                }
            },
            [internalState, song],
        );

        return (
            <tr
                className={
                    isSelected
                        ? styles.trackRowSelected
                        : isDragging
                          ? styles.trackRowDragging
                          : undefined
                }
                onClick={handleRowClick}
                ref={dragRef ?? undefined}
            >
                <td className={styles.trackColNumber} style={{ fontFamily: 'monospace' }}>
                    {discAndCol}
                </td>
                <td className={styles.trackColTitle}>{song.name}</td>
                <td className={styles.trackColDuration} style={{ fontFamily: 'monospace' }}>
                    {formatDuration(song.duration)}
                </td>
                <td className={styles.trackColFavorite}>
                    <div
                        aria-disabled={isMutatingFavorite}
                        onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            onFavoriteClick(song);
                        }}
                        onDoubleClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                        }}
                        role="button"
                    >
                        <Icon icon="favorite" size="xs" />
                    </div>
                </td>
                <td className={styles.trackColRating}>
                    <ReadOnlyRating size="md" value={song.userRating} />
                </td>
            </tr>
        );
    },
);

TrackRow.displayName = 'TrackRow';

type RowContentProps = Omit<RowComponentProps<RowData>, 'style'>;

const RowContent = memo(
    ({
        controls,
        data,
        getItem,
        index,
        internalState,
        isMutatingFavorite,
        queryClient,
        registerSongs,
    }: RowContentProps) => {
        const [showControls, setShowControls] = useState(false);
        const item = useMemo(() => {
            if (getItem) {
                return getItem(index) as Album | undefined;
            }

            return (data?.[index] as Album | undefined) || undefined;
        }, [data, getItem, index]);

        const { data: songData } = useQuery({
            enabled: !!item && !!item.id,
            ...albumQueries.detail({
                query: {
                    id: item?.id || '',
                },
                serverId: item?._serverId || '',
            }),
        });

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

        const onFavoriteClick = useCallback((song: Song) => {
            // TODO: toggle favorite for song
            void song;
        }, []);

        if (!item) {
            return (
                <>
                    <div className={styles.left}>
                        <div className={styles.metadata}>
                            <Skeleton className={styles.skeletonImage} />
                            <Skeleton className={styles.skeletonTitle} />
                            <Skeleton className={styles.skeletonArtist} />
                        </div>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.skeletonTracks}>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div className={styles.skeletonTrackRow} key={i}>
                                    <Skeleton className={styles.skeletonTrackCell} />
                                    <Skeleton className={styles.skeletonTrackCellTitle} />
                                    <Skeleton className={styles.skeletonTrackCell} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className={styles.left}>
                    <div className={styles.metadata}>
                        <Link
                            className={styles.imageWrapper}
                            onMouseEnter={() => setShowControls(true)}
                            onMouseLeave={() => setShowControls(false)}
                            state={{ item }}
                            to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                albumId: item.id,
                            })}
                        >
                            <ItemImage
                                className={styles.image}
                                id={item.imageId}
                                itemType={item._itemType}
                                type="itemCard"
                            />
                            <AnimatePresence>
                                {controls && showControls && (
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
                        <div className={styles.title}>{item.name}</div>
                        <div className={styles.artist}>{item.albumArtistName}</div>
                    </div>
                </div>

                <div className={styles.right}>
                    <table className={styles.tracksTable}>
                        <tbody>
                            {songs.map((song) => (
                                <TrackRow
                                    internalState={internalState}
                                    isMutatingFavorite={isMutatingFavorite}
                                    key={song.id}
                                    onFavoriteClick={onFavoriteClick}
                                    song={song as Song}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        );
    },
    (prev, next) =>
        prev.index === next.index &&
        prev.data === next.data &&
        prev.getItem === next.getItem &&
        prev.internalState === next.internalState &&
        prev.queryClient === next.queryClient &&
        prev.isMutatingFavorite === next.isMutatingFavorite &&
        prev.controls === next.controls &&
        prev.registerSongs === next.registerSongs,
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

export const ItemDetailList = ({
    currentPage,
    data,
    dataVersion,
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
        defaultRowHeight: 300,
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

    const handleRowsRendered = useCallback(
        (range: { startIndex: number; stopIndex: number }) => {
            if (onRangeChanged) {
                onRangeChanged(range);
            }
        },
        [onRangeChanged],
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
            controls,
            data: dataSource,
            getItem,
            internalState,
            isMutatingFavorite,
            queryClient,
            registerSongs,
        }),
        [
            controls,
            dataSource,
            getItem,
            internalState,
            isMutatingFavorite,
            queryClient,
            registerSongs,
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
        <div className={styles.container} ref={containerRef}>
            <List
                onRowsRendered={throttledHandleRowsRendered}
                rowComponent={RowComponent as (props: RowComponentProps<RowData>) => ReactElement}
                rowCount={itemCount}
                rowHeight={rowHeight}
                rowProps={rowProps}
            />
        </div>
    );
};
