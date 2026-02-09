import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemDetailList } from '/@/renderer/components/item-list/item-detail-list/item-detail';
import { ItemListComponentProps } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumListInfiniteDetailProps extends ItemListComponentProps<AlbumListQuery> {
    enableHeader?: boolean;
}

export const AlbumListInfiniteDetail = ({
    enableHeader = true,
    itemsPerPage = 100,
    query = {
        sortBy: AlbumListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
}: AlbumListInfiniteDetailProps) => {
    const listCountQuery = albumQueries.listCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getAlbumList;

    const { getItem, itemCount, loadedItems, onRangeChanged } = useItemListInfiniteLoader({
        eventKey: ItemListKey.ALBUM,
        itemsPerPage,
        itemType: LibraryItem.ALBUM,
        listCountQuery,
        listQueryFn,
        query,
        serverId,
    });

    const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
        enabled: saveScrollOffset,
    });

    return (
        <ItemDetailList
            data={loadedItems}
            enableHeader={enableHeader}
            getItem={getItem}
            itemCount={itemCount}
            onRangeChanged={onRangeChanged}
        />
    );
};
