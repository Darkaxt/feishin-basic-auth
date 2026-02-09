import { ItemDetailListCellProps } from '/@/renderer/components/item-list/item-detail-list/columns/types';
import { ExplicitIndicator } from '/@/shared/components/explicit-indicator/explicit-indicator';

export const TitleCombinedColumn = ({ song }: ItemDetailListCellProps) => (
    <>
        <ExplicitIndicator explicitStatus={song.explicitStatus} />
        {[song.name, song.artistName].filter(Boolean).join(' — ') ?? <>&nbsp;</>}
    </>
);
