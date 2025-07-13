import { useTranslation } from 'react-i18next';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { ListSortOrder } from '/@/shared/types/domain/shared-domain-types';

interface OrderToggleButtonProps {
    buttonProps?: Partial<ActionIconProps>;
    onToggle: () => void;
    sortOrder: ListSortOrder;
}

export const OrderToggleButton = ({ buttonProps, onToggle, sortOrder }: OrderToggleButtonProps) => {
    const { t } = useTranslation();

    return (
        <ActionIcon
            icon={sortOrder === ListSortOrder.ASC ? 'sortAsc' : 'sortDesc'}
            iconProps={{
                size: 'lg',
            }}
            onClick={onToggle}
            tooltip={{
                label:
                    sortOrder === ListSortOrder.ASC
                        ? t('common.ascending', { postProcess: 'sentenceCase' })
                        : t('common.descending', { postProcess: 'sentenceCase' }),
            }}
            variant="subtle"
            {...buttonProps}
        />
    );
};
