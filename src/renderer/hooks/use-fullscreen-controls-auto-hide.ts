import { useCallback, useEffect, useRef, useState } from 'react';

export const FULLSCREEN_CONTROLS_IDLE_MS = 3_000;

const isWholeDocumentFullscreen = () => document.fullscreenElement === document.documentElement;

export const useFullscreenControlsAutoHide = () => {
    const [controlsHidden, setControlsHidden] = useState(false);
    const hideTimeoutRef = useRef<null | number>(null);

    const clearHideTimeout = useCallback(() => {
        if (hideTimeoutRef.current !== null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    const showControlsAndScheduleHide = useCallback(() => {
        clearHideTimeout();
        setControlsHidden(false);

        if (!isWholeDocumentFullscreen()) {
            return;
        }

        hideTimeoutRef.current = window.setTimeout(() => {
            if (isWholeDocumentFullscreen()) {
                setControlsHidden(true);
            }
        }, FULLSCREEN_CONTROLS_IDLE_MS);
    }, [clearHideTimeout]);

    useEffect(() => {
        const handleFullscreenChange = () => showControlsAndScheduleHide();
        const handleActivity = () => {
            if (isWholeDocumentFullscreen()) {
                showControlsAndScheduleHide();
            }
        };
        const passiveOptions = { passive: true } as const;

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleActivity, true);
        window.addEventListener('pointerdown', handleActivity);
        window.addEventListener('pointermove', handleActivity);
        window.addEventListener('touchstart', handleActivity, passiveOptions);
        window.addEventListener('wheel', handleActivity, passiveOptions);
        showControlsAndScheduleHide();

        return () => {
            clearHideTimeout();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleActivity, true);
            window.removeEventListener('pointerdown', handleActivity);
            window.removeEventListener('pointermove', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('wheel', handleActivity);
        };
    }, [clearHideTimeout, showControlsAndScheduleHide]);

    return controlsHidden;
};
