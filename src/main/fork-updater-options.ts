// Fork releases are tagged `vX.Y.Z-ba.N` and published as the repository's GitHub "latest"
// release. With `allowPrerelease`, electron-updater only follows tags whose prerelease label is
// the current channel (`latest`, `alpha` or `beta`), so it skipped every `-ba.N` tag and failed
// with "No published versions on GitHub". Without it, the updater resolves GitHub's latest
// release and still compares `-ba.N` versions semantically (ba.41 > ba.40).
export const FORK_UPDATER_OPTIONS = {
    allowDowngrade: false,
    allowPrerelease: false,
    autoDownload: true,
    autoInstallOnAppQuit: true,
    channel: 'latest',
} as const;

export const FORK_UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
