import type { UpdaterStatus } from '/@/shared/types/updater';

import { BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

import { FORK_UPDATE_CHECK_INTERVAL_MS, FORK_UPDATER_OPTIONS } from './fork-updater-options';
import log, { autoUpdaterLogInterface } from './logger';

// Downloads fork releases in the background and installs them on "Restart to update" or,
// silently, when the app quits. The renderer follows progress through `updater-status`.
let status: UpdaterStatus = { state: 'idle' };
let started = false;
let getWindow: () => BrowserWindow | null = () => null;

const setStatus = (next: UpdaterStatus) => {
    status = next;
    getWindow()?.webContents.send('updater-status', next);
};

const check = async () => {
    if (['checking', 'downloaded', 'downloading'].includes(status.state)) return;

    try {
        const result = await autoUpdater.checkForUpdates();
        // Download failures are reported through the 'error' event.
        result?.downloadPromise?.catch(() => undefined);
    } catch (error) {
        log.error('Check for updates failed', error);
    }
};

export const startForkUpdater = (options: {
    beforeInstall: () => void;
    enabled: boolean;
    getMainWindow: () => BrowserWindow | null;
}) => {
    getWindow = options.getMainWindow;
    if (started) return;
    started = true;

    ipcMain.handle('updater-get-status', () => status);
    ipcMain.on('updater-install', () => {
        if (status.state !== 'downloaded') return;
        log.info('Updater restarting to install', { version: status.version });
        options.beforeInstall();
        autoUpdater.quitAndInstall(true, true);
    });

    if (!options.enabled) {
        log.info('Automatic updates are disabled');
        return;
    }

    autoUpdater.logger = autoUpdaterLogInterface;
    // Setting the channel turns allowDowngrade on, so it goes first.
    autoUpdater.channel = FORK_UPDATER_OPTIONS.channel;
    autoUpdater.allowDowngrade = FORK_UPDATER_OPTIONS.allowDowngrade;
    autoUpdater.allowPrerelease = FORK_UPDATER_OPTIONS.allowPrerelease;
    autoUpdater.autoDownload = FORK_UPDATER_OPTIONS.autoDownload;
    autoUpdater.autoInstallOnAppQuit = FORK_UPDATER_OPTIONS.autoInstallOnAppQuit;

    autoUpdater.on('checking-for-update', () => {
        log.info('Updater checking for update');
        setStatus({ state: 'checking' });
    });
    autoUpdater.on('update-not-available', (info) => {
        log.info('Updater update not available', { version: info.version });
        setStatus({ state: 'idle' });
    });
    autoUpdater.on('update-available', (info) => {
        log.info('Updater update available, downloading', { version: info.version });
        setStatus({ percent: 0, state: 'downloading', version: info.version });
    });
    autoUpdater.on('download-progress', (progress) => {
        const percent = Math.floor(progress.percent);
        if (status.state === 'downloading' && percent !== status.percent) {
            setStatus({ ...status, percent });
        }
    });
    autoUpdater.on('update-downloaded', (info) => {
        log.info('Updater download complete', { version: info.version });
        setStatus({ state: 'downloaded', version: info.version });
    });
    autoUpdater.on('error', (error) => {
        log.error('Updater error', error);
        if (status.state !== 'downloaded') setStatus({ state: 'error' });
    });

    void check();
    setInterval(() => void check(), FORK_UPDATE_CHECK_INTERVAL_MS);
};
