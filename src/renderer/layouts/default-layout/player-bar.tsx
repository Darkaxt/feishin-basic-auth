import clsx from 'clsx';

import styles from './player-bar.module.css';

import { Playerbar } from '/@/renderer/features/player/components/playerbar';
import { usePlayerbarOpenDrawer } from '/@/renderer/store';

export const PlayerBar = () => {
    const playerbarOpenDrawer = usePlayerbarOpenDrawer();

    return (
        <div
            className={clsx(styles.wrapper, {
                [styles.openDrawer]: playerbarOpenDrawer,
            })}
            id="player-bar"
        >
            <div className={styles.bar}>
                <Playerbar />
            </div>
        </div>
    );
};
