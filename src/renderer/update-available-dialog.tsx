import { useTranslation } from 'react-i18next';

import { toTag } from '/@/renderer/hooks';
import { installUpdate, useUpdaterStatus } from '/@/renderer/hooks/use-updater-status';
import { Button } from '/@/shared/components/button/button';
import { Dialog } from '/@/shared/components/dialog/dialog';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';

// Shown once per version when the background download finishes.
export const UpdateAvailableDialog = () => {
    const { t } = useTranslation();
    const updater = useUpdaterStatus();
    const [versionDismissed, setVersionDismissed] = useLocalStorage<string>({
        key: 'version_dismissed',
    });

    if (updater.state !== 'downloaded' || versionDismissed === updater.version) return null;

    const version = updater.version;
    const handleDismiss = () => setVersionDismissed(version);

    return (
        <Dialog
            onClose={handleDismiss}
            opened
            position={{ bottom: 100, right: 12 }}
            radius="md"
            size="lg"
            withCloseButton
        >
            <Stack gap="md">
                <Text fw={700} size="md">
                    {t('common.updateReady', { version: `v${version}` })}
                </Text>
                <Text size="sm">{t('common.updateReadyDescription')}</Text>
                <Group justify="flex-end">
                    <Button
                        component="a"
                        href={`https://github.com/Darkaxt/feishin-basic-auth/releases/tag/${toTag(version)}`}
                        rightSection={<Icon icon="externalLink" size="sm" />}
                        size="xs"
                        target="_blank"
                        variant="subtle"
                    >
                        {t('action.viewMore')}
                    </Button>
                    <Button onClick={handleDismiss} size="xs" variant="default">
                        {t('action.later')}
                    </Button>
                    <Button onClick={installUpdate} size="xs" variant="filled">
                        {t('action.restartToUpdate')}
                    </Button>
                </Group>
            </Stack>
        </Dialog>
    );
};
