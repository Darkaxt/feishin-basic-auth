import { ipcRenderer } from 'electron';

const setLocalSurfaceVisible = (visible: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('visualizer-set-local-surface-visible', visible);
};

const onAudioReconfigured = (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on('visualizer-audio-reconfigured', listener);
    return () => {
        ipcRenderer.removeListener('visualizer-audio-reconfigured', listener);
    };
};

export const visualizer = {
    onAudioReconfigured,
    setLocalSurfaceVisible,
};

export type VisualizerApi = typeof visualizer;
