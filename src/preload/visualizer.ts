import { ipcRenderer } from 'electron';

const setLocalSurfaceVisible = (visible: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('visualizer-set-local-surface-visible', visible);
};

export const visualizer = {
    setLocalSurfaceVisible,
};

export type VisualizerApi = typeof visualizer;
