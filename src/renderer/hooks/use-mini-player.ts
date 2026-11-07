import isElectron from 'is-electron';
import { useEffect } from 'react';
import { flushSync } from 'react-dom';

import { useMiniPlayerStore } from '/@/renderer/store/mini-player.store';
import { usePlayerSong } from '/@/renderer/store/player.store';
import { useWindowSettings } from '/@/renderer/store/settings.store';

export const useMiniPlayer = () => {
    const song = usePlayerSong();
    const { miniPlayerAlwaysOnTop, miniPlayerOnMinimize } = useWindowSettings();
    useEffect(() => {
        if (!isElectron()) return;
        let receivedEvent = false;
        let cancelViewportWait = () => {};
        const unsubscribe = window.api.browser.onMiniPlayerState((state) => {
            receivedEvent = true;
            cancelViewportWait();
            const apply = () => {
                // Native resize completes before Chromium receives its new viewport.
                // Keep mini presentation until that real resize arrives.
                if (
                    !state.active &&
                    useMiniPlayerStore.getState().active &&
                    state.viewportWidth !== undefined &&
                    Math.abs(window.innerWidth - state.viewportWidth) > 1
                )
                    return;
                cancelViewportWait();
                flushSync(() => useMiniPlayerStore.setState(state));
            };
            window.addEventListener('resize', apply);
            cancelViewportWait = () => window.removeEventListener('resize', apply);
            apply();
        });
        void window.api.browser.miniPlayerState().then((state) => {
            if (!receivedEvent) useMiniPlayerStore.setState(state);
        });
        return () => {
            cancelViewportWait();
            unsubscribe();
        };
    }, []);
    useEffect(() => {
        if (isElectron()) window.api.browser.miniPlayerTrack(Boolean(song));
    }, [song]);
    useEffect(() => {
        if (!isElectron()) return;
        window.api.localSettings.set('window_mini_player_on_minimize', miniPlayerOnMinimize);
        window.api.localSettings.set('window_mini_player_always_on_top', miniPlayerAlwaysOnTop);
    }, [miniPlayerAlwaysOnTop, miniPlayerOnMinimize]);
};
