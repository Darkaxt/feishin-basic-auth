import isElectron from 'is-electron';
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

const MUSICBRAINZ_COUNTRY_CODES: Record<string, string> = {
    AD: 'Andorra',
    AE: 'United Arab Emirates',
    AF: 'Afghanistan',
    AG: 'Antigua and Barbuda',
    AI: 'Anguilla',
    AL: 'Albania',
    AM: 'Armenia',
    AN: 'Netherlands Antilles',
    AO: 'Angola',
    AQ: 'Antarctica',
    AR: 'Argentina',
    AS: 'American Samoa',
    AT: 'Austria',
    AU: 'Australia',
    AW: 'Aruba',
    AX: 'Åland Islands',
    AZ: 'Azerbaijan',
    BA: 'Bosnia and Herzegovina',
    BB: 'Barbados',
    BD: 'Bangladesh',
    BE: 'Belgium',
    BF: 'Burkina Faso',
    BG: 'Bulgaria',
    BH: 'Bahrain',
    BI: 'Burundi',
    BJ: 'Benin',
    BL: 'Saint Barthélemy',
    BM: 'Bermuda',
    BN: 'Brunei',
    BO: 'Bolivia',
    BQ: 'Bonaire, Sint Eustatius and Saba',
    BR: 'Brazil',
    BS: 'Bahamas',
    BT: 'Bhutan',
    BV: 'Bouvet Island',
    BW: 'Botswana',
    BY: 'Belarus',
    BZ: 'Belize',
    CA: 'Canada',
    CC: 'Cocos (Keeling) Islands',
    CD: 'Democratic Republic of the Congo',
    CF: 'Central African Republic',
    CG: 'Congo',
    CH: 'Switzerland',
    CI: "Côte d'Ivoire",
    CK: 'Cook Islands',
    CL: 'Chile',
    CM: 'Cameroon',
    CN: 'China',
    CO: 'Colombia',
    CR: 'Costa Rica',
    CS: 'Serbia and Montenegro',
    CU: 'Cuba',
    CV: 'Cape Verde',
    CW: 'Curaçao',
    CX: 'Christmas Island',
    CY: 'Cyprus',
    CZ: 'Czechia',
    DE: 'Germany',
    DJ: 'Djibouti',
    DK: 'Denmark',
    DM: 'Dominica',
    DO: 'Dominican Republic',
    DZ: 'Algeria',
    EC: 'Ecuador',
    EE: 'Estonia',
    EG: 'Egypt',
    EH: 'Western Sahara',
    ER: 'Eritrea',
    ES: 'Spain',
    ET: 'Ethiopia',
    FI: 'Finland',
    FJ: 'Fiji',
    FK: 'Falkland Islands',
    FM: 'Federated States of Micronesia',
    FO: 'Faroe Islands',
    FR: 'France',
    GA: 'Gabon',
    GB: 'United Kingdom',
    GD: 'Grenada',
    GE: 'Georgia',
    GF: 'French Guiana',
    GG: 'Guernsey',
    GH: 'Ghana',
    GI: 'Gibraltar',
    GL: 'Greenland',
    GM: 'Gambia',
    GN: 'Guinea',
    GP: 'Guadeloupe',
    GQ: 'Equatorial Guinea',
    GR: 'Greece',
    GS: 'South Georgia and the South Sandwich Islands',
    GT: 'Guatemala',
    GU: 'Guam',
    GW: 'Guinea-Bissau',
    GY: 'Guyana',
    HK: 'Hong Kong',
    HM: 'Heard Island and McDonald Islands',
    HN: 'Honduras',
    HR: 'Croatia',
    HT: 'Haiti',
    HU: 'Hungary',
    ID: 'Indonesia',
    IE: 'Ireland',
    IL: 'Israel',
    IM: 'Isle of Man',
    IN: 'India',
    IO: 'British Indian Ocean Territory',
    IQ: 'Iraq',
    IR: 'Iran',
    IS: 'Iceland',
    IT: 'Italy',
    JE: 'Jersey',
    JM: 'Jamaica',
    JO: 'Jordan',
    JP: 'Japan',
    KE: 'Kenya',
    KG: 'Kyrgyzstan',
    KH: 'Cambodia',
    KI: 'Kiribati',
    KM: 'Comoros',
    KN: 'Saint Kitts and Nevis',
    KP: 'North Korea',
    KR: 'South Korea',
    KW: 'Kuwait',
    KY: 'Cayman Islands',
    KZ: 'Kazakhstan',
    LA: 'Laos',
    LB: 'Lebanon',
    LC: 'Saint Lucia',
    LI: 'Liechtenstein',
    LK: 'Sri Lanka',
    LR: 'Liberia',
    LS: 'Lesotho',
    LT: 'Lithuania',
    LU: 'Luxembourg',
    LV: 'Latvia',
    LY: 'Libya',
    MA: 'Morocco',
    MC: 'Monaco',
    MD: 'Moldova',
    ME: 'Montenegro',
    MF: 'Saint Martin (French part)',
    MG: 'Madagascar',
    MH: 'Marshall Islands',
    MK: 'North Macedonia',
    ML: 'Mali',
    MM: 'Myanmar',
    MN: 'Mongolia',
    MO: 'Macao',
    MP: 'Northern Mariana Islands',
    MQ: 'Martinique',
    MR: 'Mauritania',
    MS: 'Montserrat',
    MT: 'Malta',
    MU: 'Mauritius',
    MV: 'Maldives',
    MW: 'Malawi',
    MX: 'Mexico',
    MY: 'Malaysia',
    MZ: 'Mozambique',
    NA: 'Namibia',
    NC: 'New Caledonia',
    NE: 'Niger',
    NF: 'Norfolk Island',
    NG: 'Nigeria',
    NI: 'Nicaragua',
    NL: 'Netherlands',
    NO: 'Norway',
    NP: 'Nepal',
    NR: 'Nauru',
    NU: 'Niue',
    NZ: 'New Zealand',
    OM: 'Oman',
    PA: 'Panama',
    PE: 'Peru',
    PF: 'French Polynesia',
    PG: 'Papua New Guinea',
    PH: 'Philippines',
    PK: 'Pakistan',
    PL: 'Poland',
    PM: 'Saint Pierre and Miquelon',
    PN: 'Pitcairn',
    PR: 'Puerto Rico',
    PS: 'Palestine',
    PT: 'Portugal',
    PW: 'Palau',
    PY: 'Paraguay',
    QA: 'Qatar',
    RE: 'Réunion',
    RO: 'Romania',
    RS: 'Serbia',
    RU: 'Russia',
    RW: 'Rwanda',
    SA: 'Saudi Arabia',
    SB: 'Solomon Islands',
    SC: 'Seychelles',
    SD: 'Sudan',
    SE: 'Sweden',
    SG: 'Singapore',
    SH: 'Saint Helena, Ascension and Tristan da Cunha',
    SI: 'Slovenia',
    SJ: 'Svalbard and Jan Mayen',
    SK: 'Slovakia',
    SL: 'Sierra Leone',
    SM: 'San Marino',
    SN: 'Senegal',
    SO: 'Somalia',
    SR: 'Suriname',
    SS: 'South Sudan',
    ST: 'Sao Tome and Principe',
    SU: 'Soviet Union',
    SV: 'El Salvador',
    SX: 'Sint Maarten (Dutch part)',
    SY: 'Syria',
    SZ: 'Eswatini',
    TC: 'Turks and Caicos Islands',
    TD: 'Chad',
    TF: 'French Southern Territories',
    TG: 'Togo',
    TH: 'Thailand',
    TJ: 'Tajikistan',
    TK: 'Tokelau',
    TL: 'Timor-Leste',
    TM: 'Turkmenistan',
    TN: 'Tunisia',
    TO: 'Tonga',
    TR: 'Turkey',
    TT: 'Trinidad and Tobago',
    TV: 'Tuvalu',
    TW: 'Taiwan',
    TZ: 'Tanzania',
    UA: 'Ukraine',
    UG: 'Uganda',
    UM: 'United States Minor Outlying Islands',
    US: 'United States',
    UY: 'Uruguay',
    UZ: 'Uzbekistan',
    VA: 'Vatican City',
    VC: 'Saint Vincent and The Grenadines',
    VE: 'Venezuela',
    VG: 'British Virgin Islands',
    VI: 'U.S. Virgin Islands',
    VN: 'Vietnam',
    VU: 'Vanuatu',
    WF: 'Wallis and Futuna',
    WS: 'Samoa',
    XC: 'Czechoslovakia',
    XE: 'Europe',
    XG: 'East Germany',
    XK: 'Kosovo',
    XW: '[Worldwide]',
    YE: 'Yemen',
    YT: 'Mayotte',
    YU: 'Yugoslavia',
    ZA: 'South Africa',
    ZM: 'Zambia',
    ZW: 'Zimbabwe',
};

const MUSICBRAINZ_COUNTRY_OPTIONS = Object.entries(MUSICBRAINZ_COUNTRY_CODES)
    .map(([code, name]) => ({ label: `${code} - ${name}`, value: code }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
                <MultiSelect
                    aria-label={t('setting.musicbrainzPrioritizeCountries', {
                        postProcess: 'sentenceCase',
                    })}
                    clearable
                    data={MUSICBRAINZ_COUNTRY_OPTIONS}
                    defaultValue={settings.musicBrainzPrioritizeCountries
                        .map((c) => c.toUpperCase())
                        .filter((code) => code in MUSICBRAINZ_COUNTRY_CODES)}
                    onChange={(value) =>
                        updateIntegrations({ musicBrainzPrioritizeCountries: value })
                    }
                    searchable
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
                    aria-label={t('setting.musicbrainzAutoCountryPriority', {
                        postProcess: 'sentenceCase',
                    })}
                    defaultChecked={settings.musicbrainzAutoCountryPriority}
                    onChange={(e) =>
                        updateIntegrations({
                            musicbrainzAutoCountryPriority: e.currentTarget.checked,
                        })
                    }
                />
            ),
            description: t('setting.musicbrainzAutoCountryPriority', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !musicBrainz || !settings.musicBrainz,
            title: t('setting.musicbrainzAutoCountryPriority', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    aria-label={t('setting.youtube', { postProcess: 'sentenceCase' })}
                    defaultChecked={settings.youtube}
                    disabled={!isElectron()}
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
            <SettingsSection options={options} title={'MusicBrainz'} />
        </Stack>
    );
});
