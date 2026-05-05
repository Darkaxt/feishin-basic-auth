import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsFetchingItemListCount } from '/@/renderer/components/item-list/helpers/use-is-fetching-item-list';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { GenreListHeaderFilters } from '/@/renderer/features/genres/components/genre-list-header-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Genre, LibraryItem } from '/@/shared/types/domain-types';

interface GenreListHeaderProps {
    title?: string;
}

export const GenreListHeader = ({ title }: GenreListHeaderProps) => {
    const { t } = useTranslation();

    const pageTitle = title || t('page.genreList.title', { postProcess: 'titleCase' });

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar ignoreMaxWidth>
                    <PlayButton />
                    <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>
                    <GenreListHeaderBadge />
                </LibraryHeaderBar>
                <Group>
                    <ListSearchInput />
                </Group>
            </PageHeader>
            <FilterBar>
                <GenreListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};

const GenreListHeaderBadge = () => {
    const { itemCount } = useListContext();

    const isFetching = useIsFetchingItemListCount({
        itemType: LibraryItem.GENRE,
    });

    return <LibraryHeaderBar.Badge isLoading={isFetching}>{itemCount}</LibraryHeaderBar.Badge>;
};

const PlayButton = () => {
    const { selectedItems } = useListContext();
    const genreIds = useMemo(() => {
        return (selectedItems ?? [])
            .filter((item): item is Genre => {
                return (
                    typeof item === 'object' &&
                    item !== null &&
                    'id' in item &&
                    typeof (item as Genre).id === 'string' &&
                    '_itemType' in item &&
                    (item as Genre)._itemType === LibraryItem.GENRE
                );
            })
            .map((genre) => genre.id);
    }, [selectedItems]);

    return (
        <LibraryHeaderBar.PlayButton
            disabled={genreIds.length === 0}
            ids={genreIds}
            itemType={LibraryItem.GENRE}
        />
    );
};
