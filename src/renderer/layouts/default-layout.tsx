import clsx from 'clsx';
import isElectron from 'is-electron';

import styles from './default-layout.module.css';

import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { MiniPlayer } from '/@/renderer/features/player/components/mini-player';
import { useFullscreenControlsAutoHide } from '/@/renderer/hooks/use-fullscreen-controls-auto-hide';
import { MainContent } from '/@/renderer/layouts/default-layout/main-content';
import { PlayerBar } from '/@/renderer/layouts/default-layout/player-bar';
import { WindowBar } from '/@/renderer/layouts/window-bar';
import { useMiniPlayerStore } from '/@/renderer/store/mini-player.store';
import { useSettingsStore, useWindowBarStyle } from '/@/renderer/store/settings.store';
import { Platform, PlayerType } from '/@/shared/types/types';

if (!isElectron()) {
    useSettingsStore.getState().actions.setSettings({
        playback: {
            type: PlayerType.WEB,
        },
    });
}

interface DefaultLayoutProps {
    shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
    const windowBarStyle = useWindowBarStyle();
    const mini = useMiniPlayerStore((state) => state.active);
    const fullscreenControlsHidden = useFullscreenControlsAutoHide();

    return (
        <>
            <div
                className={clsx(styles.layout, {
                    [styles.fullscreenControlsHidden]: fullscreenControlsHidden,
                    [styles.macos]: windowBarStyle === Platform.MACOS,
                    [styles.windows]: windowBarStyle === Platform.WINDOWS,
                })}
                id="default-layout"
                inert={mini}
                style={mini ? { pointerEvents: 'none', visibility: 'hidden' } : undefined}
            >
                <WindowBar />
                <MainContent shell={shell} />
                <PlayerBar />
            </div>
            {mini && <MiniPlayer />}
            <ContextMenuController.Root />
        </>
    );
};
