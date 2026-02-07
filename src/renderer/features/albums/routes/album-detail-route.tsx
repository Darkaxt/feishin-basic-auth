import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useLocation, useParams } from 'react-router';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumDetailContent } from '/@/renderer/features/albums/components/album-detail-content';
import { AlbumDetailHeader } from '/@/renderer/features/albums/components/album-detail-header';
import { isMbzAlbumId } from '/@/renderer/features/musicbrainz/utils';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import {
    LibraryBackgroundImage,
    LibraryBackgroundOverlay,
} from '/@/renderer/features/shared/components/library-background-overlay';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useAlbumBackground, useCurrentServerId } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

const AlbumDetailRoute = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const { albumBackground, albumBackgroundBlur } = useAlbumBackground();

    const { albumId } = useParams() as { albumId: string };
    const serverId = useCurrentServerId();
    const isMbz = isMbzAlbumId(albumId);

    const location = useLocation();

    const detailQuery = useQuery({
        ...albumQueries.detail({
            query: { id: albumId },
            serverId: isMbz ? 'musicbrainz' : serverId,
        }),
        placeholderData: location.state?.item,
    });

    const imageUrl =
        useItemImageUrl({
            id: detailQuery?.data?.imageId || undefined,
            imageUrl: detailQuery?.data?.imageUrl || undefined,
            itemType: LibraryItem.ALBUM,
            type: 'itemCard',
        }) || '';

    const { background: backgroundColor, isLoading: isColorLoading } = useFastAverageColor({
        id: albumId,
        src: imageUrl,
        srcLoaded: true,
    });

    const background = backgroundColor;

    const showBlurredImage = albumBackground;

    if (isColorLoading || (detailQuery.isLoading && !detailQuery.data)) {
        return <Spinner container />;
    }

    const isExternal = detailQuery?.data?._serverType === ServerType.EXTERNAL;

    return (
        <AnimatedPage key={`album-detail-${albumId}`}>
            <NativeScrollArea
                pageHeaderProps={{
                    backgroundColor: backgroundColor || undefined,
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.PlayButton
                                disabled={isExternal}
                                ids={[albumId]}
                                itemType={LibraryItem.ALBUM}
                                variant="default"
                            />
                            <LibraryHeaderBar.Title>
                                {detailQuery?.data?.name}
                            </LibraryHeaderBar.Title>
                        </LibraryHeaderBar>
                    ),
                    offset: 200,
                    target: headerRef,
                }}
                ref={scrollAreaRef}
            >
                {showBlurredImage ? (
                    <LibraryBackgroundImage
                        blur={albumBackgroundBlur}
                        headerRef={headerRef}
                        imageUrl={imageUrl}
                    />
                ) : (
                    <LibraryBackgroundOverlay backgroundColor={background} headerRef={headerRef} />
                )}
                <LibraryContainer>
                    <AlbumDetailHeader ref={headerRef as React.Ref<HTMLDivElement>} />
                    <AlbumDetailContent />
                </LibraryContainer>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

const AlbumDetailRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <AlbumDetailRoute />
        </PageErrorBoundary>
    );
};

export default AlbumDetailRouteWithBoundary;
