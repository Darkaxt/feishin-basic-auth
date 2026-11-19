import { useTranslation } from 'react-i18next';

import { toTag } from '/@/renderer/hooks';
import { installUpdate, useUpdaterStatus } from '/@/renderer/hooks/use-updater-status';
import { useLatestVersion } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';

export const UpdateAvailableButton = () => {
    const { t } = useTranslation();
    const updater = useUpdaterStatus();
    const { currentVersion, isUpdateAvailable, latestVersion } = useLatestVersion();

    if (updater.state === 'downloaded') {
        return (
            <Button onClick={installUpdate} size="compact-sm" variant="filled">
                {t('action.restartToUpdate')}: v{updater.version}
            </Button>
        );
    }

    if (updater.state === 'downloading') {
        return (
            <Button disabled size="compact-sm" variant="default">
                {t('common.updateDownloading', {
                    percent: updater.percent,
                    version: `v${updater.version}`,
                })}
            </Button>
        );
    }

    // Without the in-app updater (web build, updates disabled or failing), link to the release.
    if (!isUpdateAvailable || !latestVersion) {
        return null;
    }

    return (
        <Button
            component="a"
            href={`https://github.com/Darkaxt/feishin-basic-auth/releases/tag/${toTag(latestVersion || currentVersion)}`}
            size="compact-sm"
            target="_blank"
            variant="filled"
        >
            {t('common.newVersionAvailable')}: v{latestVersion}
        </Button>
    );
};
