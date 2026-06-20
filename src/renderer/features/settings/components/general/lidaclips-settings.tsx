import isElectron from 'is-electron';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useLidaClipsSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import {
    LIDA_CLIPS_AMBIENT_SYNC_MODE,
    LIDA_CLIPS_DISPLAY_MODE,
    LidaClipsSecretState,
} from '/@/shared/utils/lidaclips';

const lidaClips = isElectron() ? window.api.lidaClips : null;

const emptySecretState: LidaClipsSecretState = {
    apiKey: false,
};

export const LidaClipsSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useLidaClipsSettings();
    const { setSettings } = useSettingsStoreActions();
    const [secretState, setSecretState] = useState<LidaClipsSecretState>(emptySecretState);
    const [apiKey, setApiKey] = useState('');
    const displayModeOptions = [
        {
            label: t('setting.lidaClipsDisplayModePlayer'),
            value: LIDA_CLIPS_DISPLAY_MODE.PLAYER,
        },
        {
            label: t('setting.lidaClipsDisplayModeAmbientBackground'),
            value: LIDA_CLIPS_DISPLAY_MODE.AMBIENT_BACKGROUND,
        },
    ];
    const ambientSyncModeOptions = [
        {
            label: t('setting.lidaClipsAmbientSyncModeNatural'),
            value: LIDA_CLIPS_AMBIENT_SYNC_MODE.NATURAL,
        },
        {
            label: t('setting.lidaClipsAmbientSyncModeFitSong'),
            value: LIDA_CLIPS_AMBIENT_SYNC_MODE.FIT_SONG,
        },
    ];

    const refreshSecretState = useCallback(async () => {
        const state = await lidaClips?.getSecretState();
        setSecretState(state ?? emptySecretState);
    }, []);

    useEffect(() => {
        refreshSecretState();
    }, [refreshSecretState]);

    const updateSetting = (updates: Partial<typeof settings>) => {
        setSettings({
            lidaClips: {
                ...settings,
                ...updates,
            },
        });
    };

    const saveApiKey = async () => {
        if (!apiKey.trim()) return;
        const saved = await lidaClips?.setApiKey(apiKey.trim());

        if (!saved) {
            toast.error({ message: t('setting.lidaClipsSecretSaveError') });
            return;
        }

        setApiKey('');
        await refreshSecretState();
    };

    const clearApiKey = async () => {
        lidaClips?.removeApiKey();
        await refreshSecretState();
    };

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label={t('setting.lidaClipsEnabled')}
                    checked={settings.enabled}
                    onChange={(e) => updateSetting({ enabled: e.currentTarget.checked })}
                />
            ),
            description: t('setting.lidaClipsEnabled', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lidaClipsEnabled', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
                    onBlur={(e) => updateSetting({ baseUrl: e.currentTarget.value })}
                    onChange={(e) => updateSetting({ baseUrl: e.currentTarget.value })}
                    placeholder="https://clips.example.test"
                    value={settings.baseUrl}
                    width={320}
                />
            ),
            description: t('setting.lidaClipsBaseUrl', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lidaClipsBaseUrl', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <SegmentedControl
                    aria-label={t('setting.lidaClipsDisplayMode')}
                    data={displayModeOptions}
                    onChange={(value) =>
                        updateSetting({
                            displayMode: value as (typeof settings)['displayMode'],
                        })
                    }
                    value={settings.displayMode}
                />
            ),
            description: t('setting.lidaClipsDisplayMode', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lidaClipsDisplayMode', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <SegmentedControl
                    aria-label={t('setting.lidaClipsAmbientSyncMode')}
                    data={ambientSyncModeOptions}
                    onChange={(value) =>
                        updateSetting({
                            ambientSyncMode: value as (typeof settings)['ambientSyncMode'],
                        })
                    }
                    value={settings.ambientSyncMode}
                />
            ),
            description: t('setting.lidaClipsAmbientSyncMode', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden:
                !isElectron || settings.displayMode !== LIDA_CLIPS_DISPLAY_MODE.AMBIENT_BACKGROUND,
            title: t('setting.lidaClipsAmbientSyncMode', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Stack gap="xs">
                    <Group gap="xs" wrap="nowrap">
                        <PasswordInput
                            onChange={(e) => setApiKey(e.currentTarget.value)}
                            placeholder={
                                secretState.apiKey
                                    ? t('setting.lidaClipsSecretConfigured')
                                    : undefined
                            }
                            value={apiKey}
                            width={260}
                        />
                        <Button disabled={!apiKey.trim()} onClick={saveApiKey}>
                            {t('common.save', { postProcess: 'titleCase' })}
                        </Button>
                        <Button
                            disabled={!secretState.apiKey}
                            onClick={clearApiKey}
                            variant="subtle"
                        >
                            {t('common.clear', { postProcess: 'titleCase' })}
                        </Button>
                    </Group>
                </Stack>
            ),
            description: t('setting.lidaClipsApiKey', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !isElectron(),
            title: t('setting.lidaClipsApiKey', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={options}
            title={t('page.setting.lidaClips', { postProcess: 'sentenceCase' })}
        />
    );
});
