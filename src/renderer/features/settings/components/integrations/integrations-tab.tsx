import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    useGeneralSettings,
    useIntegrationsSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { MultiSelect } from '/@/shared/components/multi-select/multi-select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';

const MUSICBRAINZ_RELEASE_TYPES = [
    'album',
    'single',
    'ep',
    'broadcast',
    'compilation',
    'live',
    'remix',
    'appears-on',
    'audiobook',
    'audio drama',
    'demo',
    'dj-mix',
    'field recording',
    'interview',
    'mixtape/street',
    'other',
    'soundtrack',
    'spokenword',
];

export const IntegrationsTab = memo(() => {
    const { t } = useTranslation();
    const { musicBrainz } = useGeneralSettings();
    const settings = useIntegrationsSettings();
    const { setSettings } = useSettingsStoreActions();

    const updateIntegrations = (updates: Partial<typeof settings>) => {
        setSettings({
            integrations: {
                ...settings,
                ...updates,
            },
        });
    };

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label={t('setting.musicBrainzQueries', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.musicBrainz}
                    onChange={(e) => updateIntegrations({ musicBrainz: e.currentTarget.checked })}
                />
            ),
            description: t('setting.musicBrainzQueries', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.musicBrainzQueries', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <MultiSelect
                    aria-label={t('setting.musicbrainzExcludeReleaseTypes', {
                        postProcess: 'sentenceCase',
                    })}
                    clearable
                    data={MUSICBRAINZ_RELEASE_TYPES}
                    defaultValue={settings.musicBrainzExcludeReleaseTypes}
                    onChange={(value) =>
                        updateIntegrations({ musicBrainzExcludeReleaseTypes: value })
                    }
                    width={300}
                />
            ),
            description: t('setting.musicbrainzExcludeReleaseTypes', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !musicBrainz || !settings.musicBrainz,
            title: t('setting.musicbrainzExcludeReleaseTypes', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
                    defaultValue={settings.musicBrainzPrioritizeCountries.join(', ')}
                    key={settings.musicBrainzPrioritizeCountries.join(',')}
                    onBlur={(e) => {
                        const value = e.currentTarget.value
                            .split(/[,;\s]+/)
                            .map((s) => s.trim().toUpperCase())
                            .filter(Boolean);
                        updateIntegrations({ musicBrainzPrioritizeCountries: value });
                    }}
                    placeholder="e.g. US, GB, DE"
                    width={300}
                />
            ),
            description: t('setting.musicbrainzPrioritizeCountries', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !musicBrainz || !settings.musicBrainz,
            title: t('setting.musicbrainzPrioritizeCountries', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.youtube', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.youtube}
                    onChange={(e) => updateIntegrations({ youtube: e.currentTarget.checked })}
                />
            ),
            description: t('setting.youtube', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.youtube', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <Stack gap="md">
            <SettingsSection
                options={options}
                title={t('page.setting.integrationsTab', { postProcess: 'sentenceCase' })}
            />
        </Stack>
    );
});
