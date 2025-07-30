import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { memo, useCallback, useMemo } from 'react';

import { PosterCard } from '/@/renderer/components/card/poster-card';
import {
    getAlbumList,
    getInfiniteAlbumListQueryKey,
} from '/@/renderer/features/albums/api/queries/get-album-list-query';
import { GridCarousel } from '/@/shared/components/grid-carousel/grid-carousel';
import { AlbumListResponse, AlbumListSortOptions } from '/@/shared/types/domain/album-domain-types';
import { ListSortOrder } from '/@/shared/types/domain/shared-domain-types';

interface AlbumCarouselProps {
    rowCount?: number;
    serverId: string;
    sortBy: AlbumListSortOptions;
    sortOrder: ListSortOrder;
    title: string;
}

const MemoizedAlbumCard = memo(PosterCard);

export function AlbumInfiniteCarousel(props: AlbumCarouselProps) {
    const { rowCount = 1, serverId, sortBy, sortOrder, title } = props;
    const { data: albums, fetchNextPage } = useInfiniteAlbumList(serverId, sortBy, sortOrder, 20);

    const cards = useMemo(
        () =>
            albums.pages.flatMap((page) => {
                const loadedCards = page.items.map((album) => ({
                    content: <MemoizedAlbumCard controls={{}} data={album} uniqueId={album.id} />,
                    id: album.id,
                }));

                if (page.items.length === 20) {
                    return loadedCards;
                }

                return [
                    ...loadedCards,
                    ...Array.from({ length: 20 - page.items.length }).map(() => {
                        const id = nanoid();
                        return {
                            content: <MemoizedAlbumCard controls={{}} />,
                            id,
                        };
                    }),
                ];
            }),
        [albums.pages],
    );

    const handleNextPage = useCallback(() => {}, []);

    const handlePrevPage = useCallback(() => {}, []);

    if (albums.pages[0]?.items.length === 0) {
        return null;
    }

    return (
        <GridCarousel
            cards={cards}
            loadNextPage={fetchNextPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            rowCount={rowCount}
            title={title}
        />
    );
}

function useInfiniteAlbumList(
    serverId: string,
    sortBy: AlbumListSortOptions,
    sortOrder: ListSortOrder,
    limit: number,
) {
    const query = useSuspenseInfiniteQuery<AlbumListResponse>({
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.items.length < limit) {
                return undefined;
            }

            const nextPageParam = Number(lastPageParam) + limit;

            return String(nextPageParam);
        },
        initialPageParam: 0,
        queryFn: ({ pageParam }) => {
            return getAlbumList(serverId, {
                query: { limit: limit, offset: Number(pageParam), sortBy, sortOrder },
            });
        },
        queryKey: getInfiniteAlbumListQueryKey(serverId),
    });

    return query;
}
