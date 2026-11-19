// State of the in-app updater, sent from the main process to the renderer.
export type UpdaterStatus =
    | { percent: number; state: 'downloading'; version: string }
    | { state: 'checking' }
    | { state: 'downloaded'; version: string }
    | { state: 'error' }
    | { state: 'idle' };
