import type {
    LidaClipsLookupQuery,
    LidaClipsLookupResult,
    LidaClipsSecretState,
    LidaClipsServerProxyAuthSource,
    LidaClipsSettings,
} from '/@/shared/utils/lidaclips';

import { ipcRenderer } from 'electron';

type LidaClipsLookupRequest = {
    proxyAuth?: LidaClipsServerProxyAuthSource | null;
    query: LidaClipsLookupQuery;
    settings: LidaClipsSettings;
};

const lookup = (request: LidaClipsLookupRequest): Promise<LidaClipsLookupResult> => {
    return ipcRenderer.invoke('lidaclips-lookup', request);
};

const getSecretState = (): Promise<LidaClipsSecretState> => {
    return ipcRenderer.invoke('lidaclips-secret-state');
};

const setApiKey = (apiKey: string): Promise<boolean> => {
    return ipcRenderer.invoke('lidaclips-api-key-set', apiKey);
};

const removeApiKey = (): void => {
    ipcRenderer.send('lidaclips-api-key-remove');
};

export const lidaClips = {
    getSecretState,
    lookup,
    removeApiKey,
    setApiKey,
};

export type LidaClips = typeof lidaClips;
