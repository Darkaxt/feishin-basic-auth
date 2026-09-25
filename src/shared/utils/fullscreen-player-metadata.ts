type FullscreenDateMetadataValues = Partial<
    Record<'date' | 'release_date' | 'release_year' | 'year', null | number | string | undefined>
>;

type FullscreenMetadataItem = {
    disabled: boolean;
    id: string;
};

const dateMetadataItemIds = new Set(['date', 'release_date', 'release_year', 'year']);

export const dedupeFullscreenDateMetadataItems = <T extends FullscreenMetadataItem>(
    items: readonly T[],
    values: FullscreenDateMetadataValues,
): T[] => {
    const seenValues = new Set<string>();

    return items.filter((item) => {
        if (item.disabled || !dateMetadataItemIds.has(item.id)) {
            return true;
        }

        const value = values[item.id as keyof FullscreenDateMetadataValues];
        if (value === null || value === undefined || value === '') {
            return true;
        }

        const displayValue = String(value);
        if (seenValues.has(displayValue)) {
            return false;
        }

        seenValues.add(displayValue);
        return true;
    });
};
