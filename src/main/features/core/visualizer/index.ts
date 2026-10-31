import { ipcMain } from 'electron';

import { store } from '../settings';

import { PlayerType } from '/@/shared/types/types';

let isLocalVisualizerSurfaceVisible = false;

export const setLocalVisualizerSurfaceVisible = (visible: boolean) => {
    isLocalVisualizerSurfaceVisible = visible;
};

export const canHandleVisualizerDisplayMedia = (): boolean => {
    const playbackType = store.get('playbackType', PlayerType.WEB) as PlayerType;

    if (playbackType !== PlayerType.LOCAL) {
        return false;
    }

    return isLocalVisualizerSurfaceVisible;
};

ipcMain.handle('visualizer-set-local-surface-visible', (event, visible: boolean) => {
    if (event.senderFrame !== event.sender.mainFrame) return false;
    setLocalVisualizerSurfaceVisible(Boolean(visible));
    return true;
});
