import { ipcRenderer } from 'electron';

const search = (query: string) => {
    return ipcRenderer.invoke('youtube-search', query);
};

export const youtube = {
    search,
};

export type Youtube = typeof youtube;
