import clsx from 'clsx';
import { ComponentPropsWithoutRef } from 'react';

import styles from './external-song-indicator.module.css';

import { Icon } from '/@/shared/components/icon/icon';

export interface ExternalSongIndicatorProps extends ComponentPropsWithoutRef<'span'> {
    isExternal: boolean | null | undefined;
    size?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    withSpace?: boolean;
}

export const ExternalSongIndicator = ({
    className,
    isExternal,
    size = 'lg',
    withSpace = true,
    ...rest
}: ExternalSongIndicatorProps) => {
    if (!isExternal) {
        return null;
    }

    return (
        <span
            className={clsx(styles.root, className, {
                [styles.withSpace]: withSpace,
            })}
            {...rest}
        >
            <Icon icon="externalSong" size={size} />
        </span>
    );
};
