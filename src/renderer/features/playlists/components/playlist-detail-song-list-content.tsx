import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';

import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemDetailList } from '/@/renderer/components/item-list/item-detail-list/item-detail-list';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import {
    DefaultItemControlProps,
    ItemControls,
    ItemListHandle,
} from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { usePlaylistTrackList } from '/@/renderer/features/playlists/hooks/use-playlist-track-list';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { useCurrentServer, useGeneralSettings, useListSettings } from '/@/renderer/store';
import { sortAlbumList } from '/@/shared/api/utils';
import { Spinner } from '/@/shared/components/spinner/spinner';
import {
    Album,
    AlbumListSort,
    LibraryItem,
    PlaylistSongListQuery,
    PlaylistSongListResponse,
    Song,
    SortOrder,
} from '/@/shared/types/domain-types';
import {
    ItemListKey,
    ListDisplayType,
    ListPaginationType,
    Play,
    TableColumn,
} from '/@/shared/types/types';

const PlaylistDetailSongListTable = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-detail-song-list-table').then(
        (module) => ({
            default: module.PlaylistDetailSongListTable,
        }),
    ),
);

const PlaylistDetailSongListEditTable = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-detail-song-list-table').then(
        (module) => ({
            default: module.PlaylistDetailSongListEditTable,
        }),
    ),
);

const PlaylistDetailSongListGrid = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-detail-song-list-grid').then(
        (module) => ({
            default: module.PlaylistDetailSongListGrid,
        }),
    ),
);

export const PlaylistDetailSongListContent = () => {
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const queryClient = useQueryClient();

    const playlistSongsQuery = useSuspenseQuery(
        playlistsQueries.songList({
            query: {
                id: playlistId,
            },
            serverId: server?.id,
        }),
    );

    useEffect(() => {
        const handleRefresh = async (payload: { key: string }) => {
            if (
                payload.key !== ItemListKey.PLAYLIST_SONG &&
                payload.key !== ItemListKey.PLAYLIST_ALBUM
            ) {
                return;
            }

            const queryKey = playlistsQueries.songList({
                query: {
                    id: playlistId,
                },
                serverId: server?.id,
            }).queryKey;

            await queryClient.invalidateQueries({ queryKey });
            await queryClient.refetchQueries({ queryKey });
        };

        eventEmitter.on('ITEM_LIST_REFRESH', handleRefresh);

        return () => {
            eventEmitter.off('ITEM_LIST_REFRESH', handleRefresh);
        };
    }, [playlistId, queryClient, server?.id]);

    return (
        <Suspense fallback={<Spinner container />}>
            <PlaylistDetailSongList data={playlistSongsQuery.data} />
        </Suspense>
    );
};

export type OverridePlaylistSongListQuery = Omit<Partial<PlaylistSongListQuery>, 'id'>;

interface PlaylistDetailSongListViewProps {
    data: PlaylistSongListResponse;
    /** When provided, table/grid use this instead of computing from data (avoids duplicate filter/sort). */
    items?: Song[];
}

export const PlaylistDetailSongListView = ({ data, items }: PlaylistDetailSongListViewProps) => {
    const server = useCurrentServer();
    const { display, itemsPerPage, pagination, table } = useListSettings(ItemListKey.PLAYLIST_SONG);
    const { currentPage, onChange: onPageChange } = useItemListPagination();
    const isPaginated = pagination === ListPaginationType.PAGINATED;

    const paginationProps = isPaginated
        ? {
              currentPage,
              itemsPerPage,
              onPageChange,
          }
        : undefined;

    switch (display) {
        case ListDisplayType.GRID: {
            return (
                <PlaylistDetailSongListGrid
                    data={data}
                    items={items}
                    serverId={server.id}
                    {...paginationProps}
                />
            );
        }
        case ListDisplayType.TABLE: {
            return (
                <PlaylistDetailSongListTable
                    autoFitColumns={table.autoFitColumns}
                    columns={table.columns}
                    data={data}
                    enableAlternateRowColors={table.enableAlternateRowColors}
                    enableHeader={table.enableHeader}
                    enableHorizontalBorders={table.enableHorizontalBorders}
                    enableRowHoverHighlight={table.enableRowHoverHighlight}
                    enableVerticalBorders={table.enableVerticalBorders}
                    items={items}
                    serverId={server.id}
                    size={table.size}
                    {...paginationProps}
                />
            );
        }
        default:
            return null;
    }
};

export const PlaylistDetailSongListEdit = ({ data }: { data: PlaylistSongListResponse }) => {
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const { display, table } = useListSettings(ItemListKey.PLAYLIST_SONG);

    const [localData, setLocalData] = useState<PlaylistSongListResponse>(data);

    const tableRef = useRef<ItemListHandle | null>(null);

    // Listen for playlist reorder events
    useEffect(() => {
        const handleReorder = (payload: {
            edge: 'bottom' | 'top' | null;
            playlistId: string;
            sourceIds: string[];
            targetId: string;
        }) => {
            // Only handle events for this playlist
            if (payload.playlistId !== playlistId) {
                return;
            }

            setLocalData((prev) => {
                if (!prev?.items || !payload.edge) {
                    return prev;
                }

                // Create a list of IDs in current order
                const currentIds = prev.items.map((item) => item.id);

                // Find the target index
                const targetIndex = currentIds.indexOf(payload.targetId);
                if (targetIndex === -1) {
                    return prev;
                }

                // Remove all source IDs from their current positions
                const idsWithoutSources = currentIds.filter(
                    (id) => !payload.sourceIds.includes(id),
                );

                // Calculate the insertion index based on the original target position
                const sourcesBeforeTarget = payload.sourceIds.filter((id) => {
                    const sourceIndex = currentIds.indexOf(id);
                    return sourceIndex !== -1 && sourceIndex < targetIndex;
                }).length;

                // Calculate the insert index in the filtered list
                const insertIndexInFiltered =
                    payload.edge === 'top'
                        ? targetIndex - sourcesBeforeTarget
                        : targetIndex - sourcesBeforeTarget + 1;

                // Ensure insertIndex is within bounds
                const insertIndex = Math.max(
                    0,
                    Math.min(insertIndexInFiltered, idsWithoutSources.length),
                );

                // Insert source IDs at the calculated position
                const reorderedIds = [
                    ...idsWithoutSources.slice(0, insertIndex),
                    ...payload.sourceIds,
                    ...idsWithoutSources.slice(insertIndex),
                ];

                // Create a map for quick lookup
                const itemMap = new Map(prev.items.map((item) => [item.id, item]));

                // Reorder items based on new ID order
                const reorderedItems = reorderedIds
                    .map((id) => itemMap.get(id))
                    .filter((item): item is NonNullable<typeof item> => item !== undefined);

                return {
                    ...prev,
                    items: reorderedItems,
                };
            });
        };

        eventEmitter.on('PLAYLIST_REORDER', handleReorder);

        return () => {
            eventEmitter.off('PLAYLIST_REORDER', handleReorder);
        };
    }, [playlistId]);

    const columns = useMemo(() => {
        return [
            {
                align: 'center' as 'center' | 'end' | 'start',
                id: TableColumn.PLAYLIST_REORDER,
                isEnabled: true,
                pinned: 'left' as 'left' | 'right' | null,
                width: 100,
            },
            ...table.columns,
        ];
    }, [table.columns]);

    const { setListData } = useListContext();

    useEffect(() => {
        setListData?.(localData.items);
    }, [localData, setListData]);

    switch (display) {
        case ListDisplayType.GRID:
        case ListDisplayType.TABLE: {
            return (
                <PlaylistDetailSongListEditTable
                    autoFitColumns={table.autoFitColumns}
                    columns={columns}
                    data={localData}
                    enableAlternateRowColors={table.enableAlternateRowColors}
                    enableHeader={table.enableHeader}
                    enableHorizontalBorders={table.enableHorizontalBorders}
                    enableRowHoverHighlight={table.enableRowHoverHighlight}
                    enableVerticalBorders={table.enableVerticalBorders}
                    ref={tableRef}
                    serverId={server.id}
                    size={table.size}
                />
            );
        }
        default:
            return null;
    }
};

export type PlaylistAlbumRow = Album & { _playlistSongs?: Song[] };

export function playlistSongsToAlbums(songs: Song[]): PlaylistAlbumRow[] {
    if (songs.length === 0) return [];

    const rows: PlaylistAlbumRow[] = [];
    let group: Song[] = [songs[0]];
    let prevAlbumId = songs[0].albumId;

    const pushRow = (song: Song, groupSongs: Song[]) => {
        rows.push({
            _itemType: LibraryItem.ALBUM,
            _playlistSongs: groupSongs,
            _serverId: song._serverId,
            _serverType: song._serverType,
            albumArtistName: song.albumArtistName,
            albumArtists: song.albumArtists,
            artists: song.artists,
            comment: song.comment,
            createdAt: song.createdAt,
            duration: null,
            explicitStatus: song.explicitStatus,
            genres: song.genres,
            id: song.albumId,
            imageId: song.imageId,
            imageUrl: song.imageUrl,
            isCompilation: song.compilation,
            lastPlayedAt: song.lastPlayedAt,
            mbzId: null,
            mbzReleaseGroupId: null,
            name: song.album ?? '',
            originalDate: null,
            originalYear: null,
            participants: song.participants,
            playCount: null,
            recordLabels: [],
            releaseDate: song.releaseDate,
            releaseType: null,
            releaseTypes: [],
            releaseYear: song.releaseYear,
            size: null,
            songCount: null,
            sortName: song.album ?? '',
            tags: song.tags,
            updatedAt: song.updatedAt,
            userFavorite: false,
            userRating: null,
            version: null,
        });
    };

    for (let i = 1; i < songs.length; i++) {
        const song = songs[i];
        if (song.albumId === prevAlbumId) {
            group.push(song);
        } else {
            pushRow(group[0], group);
            group = [song];
            prevAlbumId = song.albumId;
        }
    }
    pushRow(group[0], group);

    return rows;
}

export const PlaylistDetailAlbumView = ({ data }: { data: PlaylistSongListResponse }) => {
    const player = usePlayer();
    const { setItemCount, setListData } = useListContext();
    const { detail, display, grid, itemsPerPage, pagination, table } = useListSettings(
        ItemListKey.PLAYLIST_ALBUM,
    );
    const { enableGridMultiSelect } = useGeneralSettings();
    const { currentPage, onChange: onPageChange } = useItemListPagination();
    const { sortBy } = useSortByFilter<AlbumListSort>(AlbumListSort.ID, ItemListKey.PLAYLIST_ALBUM);
    const { sortOrder } = useSortOrderFilter(SortOrder.ASC, ItemListKey.PLAYLIST_ALBUM);

    const albums = useMemo(() => playlistSongsToAlbums(data?.items ?? []), [data?.items]);
    const sortedAlbums = useMemo(
        () =>
            sortAlbumList(
                albums,
                (sortBy as AlbumListSort) ?? AlbumListSort.ID,
                sortOrder ?? SortOrder.ASC,
            ),
        [albums, sortBy, sortOrder],
    );

    const isPaginated = pagination === ListPaginationType.PAGINATED;
    const totalAlbumCount = sortedAlbums.length;
    const albumPageCount = Math.max(1, Math.ceil(totalAlbumCount / itemsPerPage));
    const paginatedAlbums = useMemo(() => {
        if (!isPaginated) return sortedAlbums;
        const start = currentPage * itemsPerPage;
        return sortedAlbums.slice(start, start + itemsPerPage);
    }, [isPaginated, currentPage, itemsPerPage, sortedAlbums]);
    const albumsToRender = isPaginated ? paginatedAlbums : sortedAlbums;

    const playlistSongs = useMemo(() => data?.items ?? [], [data?.items]);

    const albumControlOverrides = useMemo<Partial<ItemControls>>(() => {
        return {
            onPlay: ({
                item,
                itemType,
                playType,
            }: DefaultItemControlProps & { playType: Play }) => {
                if (!item) return;
                const rowSongs = (item as PlaylistAlbumRow)._playlistSongs;
                if (itemType === LibraryItem.ALBUM && rowSongs?.length) {
                    player.addToQueueByData(rowSongs, playType);
                    return;
                }
                player.addToQueueByFetch(item._serverId, [item.id], itemType, playType);
            },
        };
    }, [player]);

    useEffect(() => {
        setItemCount?.(totalAlbumCount);
    }, [setItemCount, totalAlbumCount]);

    useEffect(() => {
        setListData?.(data?.items ?? []);
    }, [data?.items, setListData]);

    const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({ enabled: true });
    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
    });
    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
    });
    const { handleColumnReordered: handleDetailColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
        tableKey: 'detail',
    });
    const { handleColumnResized: handleDetailColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
        tableKey: 'detail',
    });
    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.PLAYLIST_ALBUM, grid.size);

    const renderAlbumList = () => {
        switch (display) {
            case ListDisplayType.DETAIL:
                return (
                    <ItemDetailList
                        enableHeader={detail?.enableHeader}
                        items={albumsToRender}
                        listKey={ItemListKey.PLAYLIST_ALBUM}
                        onColumnReordered={handleDetailColumnReordered}
                        onColumnResized={handleDetailColumnResized}
                        onScrollEnd={handleOnScrollEnd}
                        onSongRowDoubleClick={({ internalState, item }) => {
                            if (playlistSongs.length === 0) return;
                            internalState?.setSelected([item]);
                            player.addToQueueByData(playlistSongs, Play.NOW, item.id);
                        }}
                        overrideControls={albumControlOverrides}
                        scrollOffset={scrollOffset ?? 0}
                        songsByAlbumId={{}}
                        tableId="album-detail"
                    />
                );
            case ListDisplayType.GRID:
                return (
                    <ItemGridList
                        data={albumsToRender}
                        enableExpansion
                        enableMultiSelect={enableGridMultiSelect}
                        gap={grid.itemGap}
                        initialTop={{
                            to: scrollOffset ?? 0,
                            type: 'offset',
                        }}
                        itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                        itemType={LibraryItem.ALBUM}
                        onScrollEnd={handleOnScrollEnd}
                        overrideControls={albumControlOverrides}
                        rows={rows}
                        size={grid.size}
                    />
                );
            case ListDisplayType.TABLE:
                return (
                    <ItemTableList
                        autoFitColumns={table.autoFitColumns}
                        CellComponent={ItemTableListColumn}
                        columns={table.columns}
                        data={albumsToRender}
                        enableAlternateRowColors={table.enableAlternateRowColors}
                        enableHeader={table.enableHeader}
                        enableHorizontalBorders={table.enableHorizontalBorders}
                        enableRowHoverHighlight={table.enableRowHoverHighlight}
                        enableSelection
                        enableVerticalBorders={table.enableVerticalBorders}
                        initialTop={{
                            to: scrollOffset ?? 0,
                            type: 'offset',
                        }}
                        itemType={LibraryItem.ALBUM}
                        onColumnReordered={handleColumnReordered}
                        onColumnResized={handleColumnResized}
                        onScrollEnd={handleOnScrollEnd}
                        overrideControls={albumControlOverrides}
                        size={table.size}
                    />
                );
            default:
                return null;
        }
    };

    if (isPaginated) {
        return (
            <ItemListWithPagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onChange={onPageChange}
                pageCount={albumPageCount}
                totalItemCount={totalAlbumCount}
            >
                {renderAlbumList()}
            </ItemListWithPagination>
        );
    }

    return renderAlbumList();
};

/** Track view: view mode uses centralized list derivation; edit mode uses local reorder state. */
const PlaylistDetailTrackView = ({ data }: { data: PlaylistSongListResponse }) => {
    const { isSmartPlaylist, mode } = useListContext();

    if (isSmartPlaylist) {
        return <PlaylistDetailTrackViewContent data={data} />;
    }

    if (mode === 'edit') {
        return <PlaylistDetailSongListEdit data={data} />;
    }

    return <PlaylistDetailTrackViewContent data={data} />;
};

/** Uses usePlaylistTrackList once and passes derived items to the list view. */
const PlaylistDetailTrackViewContent = ({ data }: { data: PlaylistSongListResponse }) => {
    const { sortedAndFilteredSongs } = usePlaylistTrackList(data);
    return <PlaylistDetailSongListView data={data} items={sortedAndFilteredSongs} />;
};

const PlaylistDetailSongList = ({ data }: { data: PlaylistSongListResponse }) => {
    const { displayMode } = useListContext();

    if (displayMode === LibraryItem.ALBUM) {
        return <PlaylistDetailAlbumView data={data} />;
    }

    return <PlaylistDetailTrackView data={data} />;
};
