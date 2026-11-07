import type { MiniPlayerCommand, MiniPlayerState } from '/@/shared/types/mini-player';

import { ipcRenderer } from 'electron';

const exit = () => {
    ipcRenderer.send('window-close');
};

const maximize = () => {
    ipcRenderer.send('window-maximize');
};

const minimize = () => {
    ipcRenderer.send('window-minimize');
};

const unmaximize = () => {
    ipcRenderer.send('window-unmaximize');
};

const quit = () => {
    ipcRenderer.send('window-quit');
};

const devtools = () => {
    ipcRenderer.send('window-dev-tools');
};

const clearCache = (): Promise<void> => {
    return ipcRenderer.invoke('window-clear-cache');
};

export const browser = {
    clearCache,
    devtools,
    exit,
    maximize,
    minimize,
    miniPlayerCommand: (command: MiniPlayerCommand): Promise<void> =>
        ipcRenderer.invoke('mini-player-command', command),
    miniPlayerDrag: (phase: 'end' | 'move' | 'start'): void => {
        ipcRenderer.send('mini-player-drag', phase);
    },
    miniPlayerState: (): Promise<MiniPlayerState> => ipcRenderer.invoke('mini-player-get'),
    miniPlayerTrack: (available: boolean): void => {
        ipcRenderer.send('mini-player-track', available);
    },
    onMiniPlayerState: (callback: (state: MiniPlayerState) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, state: MiniPlayerState) =>
            callback(state);
        ipcRenderer.on('mini-player-state', listener);
        return () => {
            ipcRenderer.removeListener('mini-player-state', listener);
        };
    },
    quit,
    unmaximize,
};

export type Browser = typeof browser;
