import { ItemDetailListCellProps } from '/@/renderer/components/item-list/item-detail-list/columns/types';
import { ExplicitIndicator } from '/@/shared/components/explicit-indicator/explicit-indicator';

export const TitleColumn = ({ song }: ItemDetailListCellProps) => (
    <>
        <ExplicitIndicator explicitStatus={song.explicitStatus} />
        {song.name ?? <>&nbsp;</>}
    </>
);
