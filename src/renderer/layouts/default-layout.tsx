import clsx from 'clsx';
import isElectron from 'is-electron';
import { useEffect, useLayoutEffect, useRef } from 'react';

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

// MPV and DLNA need the desktop app; the web and jukebox players also work in a browser
const WEB_PLAYBACK_TYPES = [PlayerType.WEB, PlayerType.JUKEBOX];

// Widths at or below this use the mobile layout, so they are never a desktop width to keep.
const MOBILE_MAX_WIDTH = 768;
const FALLBACK_DESKTOP_WIDTH = 1280;

if (!isElectron() && !WEB_PLAYBACK_TYPES.includes(useSettingsStore.getState().playback.type)) {
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
    const layoutRef = useRef<HTMLDivElement>(null);
    const desktopWidth = useRef(
        window.innerWidth > MOBILE_MAX_WIDTH ? window.innerWidth : FALLBACK_DESKTOP_WIDTH,
    );

    useEffect(() => {
        const record = () => {
            if (!useMiniPlayerStore.getState().active && window.innerWidth > MOBILE_MAX_WIDTH)
                desktopWidth.current = window.innerWidth;
        };
        window.addEventListener('resize', record);
        return () => window.removeEventListener('resize', record);
    }, []);

    // The hidden app stays mounted under the mini-player. Keep its last desktop width so it
    // never reflows into the tiny mini window: virtualized grids squeezed to almost no width
    // crashed React ("removeChild ... not a child of this node") and the error appeared on restore.
    useLayoutEffect(() => {
        const layout = layoutRef.current;
        if (!layout) return;
        layout.style.width = mini ? `${desktopWidth.current}px` : '';
    }, [mini]);

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
                ref={layoutRef}
                // content-visibility skips layout/paint of the hidden app while keeping it mounted
                // (MPV, LidaClips video and scroll state survive the mini-player round trip).
                style={
                    mini
                        ? {
                              contentVisibility: 'hidden',
                              pointerEvents: 'none',
                              visibility: 'hidden',
                          }
                        : undefined
                }
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
