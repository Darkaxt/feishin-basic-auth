import { BrowserWindow, ipcMain, systemPreferences } from 'electron';

// Electron reports the system accent as RRGGBBAA; the renderer uses #rrggbb.
export const normalizeSystemAccent = (value: unknown): null | string =>
    typeof value === 'string' && /^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)
        ? `#${value.slice(0, 6).toLowerCase()}`
        : null;

const readSystemAccent = (): null | string => {
    try {
        return normalizeSystemAccent(systemPreferences.getAccentColor());
    } catch {
        // Not available on this platform.
        return null;
    }
};

// Read lazily: the first request comes from the renderer, after the app is ready.
let current: null | string | undefined;

ipcMain.handle('system-accent-color', () => {
    if (current === undefined) current = readSystemAccent();
    return current;
});

if (process.platform === 'win32') {
    // Windows raises accent-color-changed for accent picks and color-changed for related
    // colour settings (such as automatic accent from the wallpaper); re-read on both.
    const refresh = () => {
        const next = readSystemAccent();
        if (next === current) return;
        current = next;
        for (const window of BrowserWindow.getAllWindows()) {
            window.webContents.send('system-accent-color', next);
        }
    };
    systemPreferences.on('accent-color-changed', refresh);
    systemPreferences.on('color-changed', refresh);
}
