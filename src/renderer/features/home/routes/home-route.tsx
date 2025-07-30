import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '/@/renderer/api/query-keys';
import { FeatureCarousel } from '/@/renderer/components/feature-carousel/feature-carousel';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { useAlbumList } from '/@/renderer/features/albums';
import { useRecentlyPlayed } from '/@/renderer/features/home/queries/recently-played-query';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { AlbumInfiniteCarousel } from '/@/renderer/features/shared/components/infinite-album-carousel/infinite-album-carousel';
import { useSongList } from '/@/renderer/features/songs';
import {
    HomeItem,
    useCurrentServer,
    useGeneralSettings,
    useWindowSettings,
} from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { AlbumListSort, AlbumListSortOptions } from '/@/shared/types/domain/album-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem, ListSortOrder } from '/@/shared/types/domain/shared-domain-types';
import { SongListSort } from '/@/shared/types/domain/song-domain-types';
import { Platform } from '/@/shared/types/types';

const HomeRoute = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();
    const itemsPerPage = 15;
    const { windowBarStyle } = useWindowSettings();
    const { homeFeature, homeItems } = useGeneralSettings();

    const feature = useAlbumList({
        options: {
            enabled: homeFeature,
            gcTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: {
            limit: 20,
            offset: 0,
            sortBy: AlbumListSort.RANDOM,
            sortOrder: ListSortOrder.DESC,
        },
        serverId: server?.id,
    });

    const featureItemsWithImage = useMemo(() => {
        return feature.data?.items?.filter((item) => item.imageUrl) ?? [];
    }, [feature.data?.items]);

    const random = useAlbumList({
        options: {
            staleTime: 1000 * 60 * 5,
        },
        query: {
            limit: itemsPerPage,
            offset: 0,
            sortBy: AlbumListSort.RANDOM,
            sortOrder: ListSortOrder.ASC,
        },
        serverId: server?.id,
    });

    const recentlyPlayed = useRecentlyPlayed({
        options: {
            staleTime: 0,
        },
        query: {
            limit: itemsPerPage,
            offset: 0,
            sortBy: AlbumListSort.RECENTLY_PLAYED,
            sortOrder: ListSortOrder.DESC,
        },
        serverId: server?.id,
    });

    const recentlyAdded = useAlbumList({
        options: {
            staleTime: 1000 * 60 * 5,
        },
        query: {
            limit: itemsPerPage,
            offset: 0,
            sortBy: AlbumListSort.RECENTLY_ADDED,
            sortOrder: ListSortOrder.DESC,
        },
        serverId: server?.id,
    });

    const mostPlayedAlbums = useAlbumList({
        options: {
            enabled: server?.type === ServerType.SUBSONIC || server?.type === ServerType.NAVIDROME,
            staleTime: 1000 * 60 * 5,
        },
        query: {
            limit: itemsPerPage,
            offset: 0,
            sortBy: AlbumListSort.PLAY_COUNT,
            sortOrder: ListSortOrder.DESC,
        },
        serverId: server?.id,
    });

    const mostPlayedSongs = useSongList(
        {
            options: {
                enabled: server?.type === ServerType.JELLYFIN,
                staleTime: 1000 * 60 * 5,
            },
            query: {
                limit: itemsPerPage,
                offset: 0,
                sortBy: SongListSort.PLAY_COUNT,
                sortOrder: ListSortOrder.DESC,
            },
            serverId: server?.id,
        },
        300,
    );

    const isLoading =
        random.isLoading ||
        recentlyPlayed.isLoading ||
        recentlyAdded.isLoading ||
        (server?.type === ServerType.JELLYFIN && mostPlayedSongs.isLoading) ||
        ((server?.type === ServerType.SUBSONIC || server?.type === ServerType.NAVIDROME) &&
            mostPlayedAlbums.isLoading);

    if (isLoading) {
        return <Spinner container />;
    }

    const carousels = {
        [HomeItem.MOST_PLAYED]: {
            data:
                server?.type === ServerType.JELLYFIN
                    ? mostPlayedSongs?.data?.items
                    : mostPlayedAlbums?.data?.items,
            itemType: server?.type === ServerType.JELLYFIN ? LibraryItem.SONG : LibraryItem.ALBUM,
            pagination: {
                itemsPerPage,
            },
            sortBy:
                server?.type === ServerType.JELLYFIN
                    ? SongListSort.PLAY_COUNT
                    : AlbumListSort.PLAY_COUNT,
            sortOrder: ListSortOrder.DESC,
            title: t('page.home.mostPlayed', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RANDOM]: {
            data: random?.data?.items,
            itemType: LibraryItem.ALBUM,
            sortBy: AlbumListSort.RANDOM,
            sortOrder: ListSortOrder.ASC,
            title: t('page.home.explore', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_ADDED]: {
            data: recentlyAdded?.data?.items,
            itemType: LibraryItem.ALBUM,
            pagination: {
                itemsPerPage,
            },
            sortBy: AlbumListSort.RECENTLY_ADDED,
            sortOrder: ListSortOrder.DESC,
            title: t('page.home.newlyAdded', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_PLAYED]: {
            data: recentlyPlayed?.data?.items,
            itemType: LibraryItem.ALBUM,
            pagination: {
                itemsPerPage,
            },
            sortBy: AlbumListSort.RECENTLY_PLAYED,
            sortOrder: ListSortOrder.DESC,
            title: t('page.home.recentlyPlayed', { postProcess: 'sentenceCase' }),
        },
    };

    const sortedCarousel = homeItems
        .filter((item) => {
            if (item.disabled) {
                return false;
            }
            if (server?.type === ServerType.JELLYFIN && item.id === HomeItem.RECENTLY_PLAYED) {
                return false;
            }

            return true;
        })
        .map((item) => ({
            ...carousels[item.id],
            uniqueId: item.id,
        }));

    const invalidateCarouselQuery = (carousel: {
        itemType: LibraryItem;
        sortBy: AlbumListSort | SongListSort;
        sortOrder: ListSortOrder;
    }) => {
        if (carousel.itemType === LibraryItem.ALBUM) {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.albums.list(server?.id, {
                    limit: itemsPerPage,
                    sortBy: carousel.sortBy,
                    sortOrder: carousel.sortOrder,
                    startIndex: 0,
                }),
            });
        }

        if (carousel.itemType === LibraryItem.SONG) {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.songs.list(server?.id, {
                    limit: itemsPerPage,
                    sortBy: carousel.sortBy,
                    sortOrder: carousel.sortOrder,
                    startIndex: 0,
                }),
            });
        }
    };

    return (
        <AnimatedPage>
            <NativeScrollArea
                pageHeaderProps={{
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.Title>
                                {t('page.home.title', { postProcess: 'titleCase' })}
                            </LibraryHeaderBar.Title>
                        </LibraryHeaderBar>
                    ),
                    offset: 200,
                }}
                ref={scrollAreaRef}
            >
                <Stack
                    gap="lg"
                    mb="5rem"
                    pt={windowBarStyle === Platform.WEB ? '5rem' : '3rem'}
                    px="2rem"
                >
                    {homeFeature && <FeatureCarousel data={featureItemsWithImage} />}

                    <AlbumInfiniteCarousel
                        serverId={server?.id ?? ''}
                        sortBy={AlbumListSortOptions.NAME}
                        sortOrder={ListSortOrder.ASC}
                        title={t('page.home.explore', { postProcess: 'sentenceCase' })}
                    />

                    {/* {sortedCarousel.map((carousel) => (
                        <MemoizedSwiperGridCarousel
                            cardRows={[
                                {
                                    property: 'name',
                                    route: {
                                        route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                        slugs: [
                                            {
                                                idProperty:
                                                    server?.type === ServerType.JELLYFIN &&
                                                    carousel.itemType === LibraryItem.SONG
                                                        ? 'albumId'
                                                        : 'id',
                                                slugProperty: 'albumId',
                                            },
                                        ],
                                    },
                                },
                                {
                                    arrayProperty: 'name',
                                    property: 'albumArtists',
                                    route: {
                                        route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                                        slugs: [
                                            {
                                                idProperty: 'id',
                                                slugProperty: 'albumArtistId',
                                            },
                                        ],
                                    },
                                },
                            ]}
                            data={carousel.data}
                            itemType={carousel.itemType}
                            key={`carousel-${carousel.uniqueId}`}
                            route={{
                                route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                slugs: [
                                    {
                                        idProperty:
                                            server?.type === ServerType.JELLYFIN &&
                                            carousel.itemType === LibraryItem.SONG
                                                ? 'albumId'
                                                : 'id',
                                        slugProperty: 'albumId',
                                    },
                                ],
                            }}
                            title={{
                                label: (
                                    <Group>
                                        <TextTitle order={3}>{carousel.title}</TextTitle>
                                        <ActionIcon
                                            onClick={() => invalidateCarouselQuery(carousel)}
                                            variant="transparent"
                                        >
                                            <Icon icon="refresh" />
                                        </ActionIcon>
                                    </Group>
                                ),
                            }}
                            uniqueId={carousel.uniqueId}
                        />
                    ))} */}
                </Stack>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default HomeRoute;
