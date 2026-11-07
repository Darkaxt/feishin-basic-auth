import type { MiniPlayerCommand, MiniPlayerState } from '/@/shared/types/mini-player';
import type { BrowserWindow, Rectangle } from 'electron';

import { expandMiniPlayerQueue, resolveMiniPlayerBounds } from '../../utils/mini-player-bounds';

interface Options {
    alwaysOnTop: () => boolean;
    area: (bounds: Rectangle) => Rectangle;
    readBounds: () => Rectangle | undefined;
    saveBounds: (bounds: Rectangle) => void;
}

/** One window, one playback session. This controller only changes window presentation. */
export const createMiniPlayer = (window: BrowserWindow, options: Options) => {
    let state: MiniPlayerState = { active: false, queueOpen: false };
    let desktop:
        | undefined
        | {
              alwaysOnTop: boolean;
              bounds: Rectangle;
              contentBounds: Rectangle;
              fullscreen: boolean;
              maximized: boolean;
          };
    let square: Rectangle;
    let applyingBounds = false;
    let pending = Promise.resolve();
    let trackAvailable = false;
    let dismissMinimize = false;

    const publish = () => window.webContents.send('mini-player-state', state);
    const updateBounds = () => {
        applyingBounds = true;
        const bounds = expandMiniPlayerQueue(square, options.area(square), state.queueOpen);
        window.setContentBounds(bounds);
        applyingBounds = false;
    };
    const remember = () => {
        if (!state.active || applyingBounds || window.isMinimized()) return;
        const bounds = window.getContentBounds();
        square = {
            ...bounds,
            height: bounds.width,
            y: bounds.y + bounds.height - bounds.width,
        };
        options.saveBounds(square);
    };
    window.on('moved', remember);
    window.on('resized', remember);
    window.on('will-resize', (event, bounds) => {
        if (!state.active) return;
        event.preventDefault();
        const current = window.getBounds();
        const content = window.getContentBounds();
        const vertical = bounds.width === current.width && bounds.height !== current.height;
        const extra = content.height - content.width;
        const width = vertical
            ? bounds.height - (current.height - content.height) - extra
            : bounds.width - (current.width - content.width);
        square = resolveMiniPlayerBounds(
            {
                width,
                x: bounds.x + content.x - current.x,
                y:
                    bounds.y +
                    content.y -
                    current.y +
                    bounds.height -
                    (current.height - content.height) -
                    width,
            },
            options.area(bounds),
        );
        updateBounds();
        options.saveBounds(square);
    });

    const restore = async () => {
        if (!state.active || !desktop) return;
        const saved = desktop;
        remember();
        state = { active: false, queueOpen: false };
        window.setMinimumSize(480, 120);
        window.setMaximizable(true);
        window.setFullScreenable(true);
        window.setAlwaysOnTop(saved.alwaysOnTop);
        window.setContentBounds(saved.contentBounds);
        if (saved.maximized) window.maximize();
        if (saved.fullscreen) window.setFullScreen(true);
        state.viewportWidth = window.getContentBounds().width / window.webContents.getZoomFactor();
        publish();
        desktop = undefined;
    };
    const enter = async () => {
        if (state.active || !trackAvailable) return;
        const normal = window.getNormalBounds();
        const outer = window.getBounds();
        const content = window.getContentBounds();
        desktop = {
            alwaysOnTop: window.isAlwaysOnTop(),
            bounds: normal,
            contentBounds:
                !window.isMaximized() && !window.isFullScreen() && !window.isMinimized()
                    ? content
                    : {
                          height: normal.height - (outer.height - content.height),
                          width: normal.width - (outer.width - content.width),
                          x: normal.x + content.x - outer.x,
                          y: normal.y + content.y - outer.y,
                      },
            fullscreen: window.isFullScreen(),
            maximized: window.isMaximized(),
        };
        if (window.isMinimized()) window.restore();
        if (desktop.fullscreen) {
            const left = new Promise<void>((resolve) =>
                window.once('leave-full-screen', () => resolve()),
            );
            window.setFullScreen(false);
            await left;
        }
        if (window.isMaximized()) {
            const restored = new Promise<void>((resolve) =>
                window.once('unmaximize', () => resolve()),
            );
            window.unmaximize();
            await restored;
        }
        const saved = options.readBounds();
        const savedDisplay =
            saved &&
            [saved.x, saved.y, saved.width, saved.height].every(Number.isFinite) &&
            saved.width > 0 &&
            saved.height > 0;
        square = resolveMiniPlayerBounds(
            saved,
            options.area(savedDisplay ? saved : desktop.bounds),
        );
        state = { active: true, queueOpen: false };
        // Notify before shrinking so responsive layout does not mount a different player.
        publish();
        window.setMinimumSize(160, 160);
        window.setMaximizable(false);
        window.setFullScreenable(false);
        window.setAlwaysOnTop(options.alwaysOnTop());
        updateBounds();
    };
    const command = (request: MiniPlayerCommand): Promise<void> => {
        pending = pending.then(async () => {
            if (window.isDestroyed()) return;
            if (request.action === 'enter') await enter();
            if (request.action === 'restore') await restore();
            if (request.action === 'queue' && state.active) {
                remember();
                state = { ...state, queueOpen: request.queueOpen === true };
                updateBounds();
                publish();
            }
            if (request.action === 'dismiss') {
                await restore();
                // This is a deliberate dismissal, not another request to enter mini mode.
                dismissMinimize = true;
                window.minimize();
            }
        });
        return pending;
    };
    return {
        command,
        consumeDismissMinimize: () => {
            const dismissed = dismissMinimize;
            dismissMinimize = false;
            return dismissed;
        },
        getDesktop: () => desktop,
        getState: () => state,
        hasTrack: () => trackAvailable,
        refreshPin: () => {
            if (state.active) window.setAlwaysOnTop(options.alwaysOnTop());
        },
        setTrackAvailable: (available: boolean) => {
            trackAvailable = available;
        },
    };
};
