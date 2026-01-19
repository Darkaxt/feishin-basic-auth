import { queryOptions } from '@tanstack/react-query';
import memoize from 'lodash/memoize';
import {
    IArtist,
    IBrowseReleasesResult,
    IRelease,
    IReleaseGroup,
    MusicBrainzApi,
} from 'musicbrainz-api';

import packageJson from '../../../../../package.json';

import { queryKeys } from '/@/renderer/api/query-keys';
import {
    Album,
    AlbumArtist,
    LibraryItem,
    RelatedArtist,
    ServerType,
} from '/@/shared/types/domain-types';

export const musicbrainzApi = new MusicBrainzApi({
    appContactInfo: packageJson.homepage,
    appName: packageJson.name,
    appVersion: packageJson.version,
});

const CACHE_TIME = 1000 * 60 * 5;

export type MusicBrainzArtistSelectMeta = {
    albumArtist: AlbumArtist;
    albums?: Album[];
    /** Release types to exclude (e.g. 'single', 'ep'). Matches primary and secondary types. */
    excludeReleaseTypes?: string[];
    /** Country codes (e.g. 'US', 'GB') to sort releases by; earlier in the list = higher priority. */
    prioritizeCountries?: string[];
};

const artistSelect = memoize(
    ({
        data,
        meta,
    }: {
        data: {
            artist: IArtist;
            releases: IBrowseReleasesResult;
        };
        meta: MusicBrainzArtistSelectMeta;
    }) => {
        const albumArtist: RelatedArtist = {
            id: meta.albumArtist.id,
            imageId: meta.albumArtist.imageId,
            imageUrl: meta.albumArtist.imageUrl,
            name: meta.albumArtist.name,
            userFavorite: meta.albumArtist.userFavorite,
            userRating: meta.albumArtist.userRating,
        };

        console.log('meta', meta);

        const ownedMbzReleaseGroupIds = new Set<string>();
        const ownedMbzReleaseIds = new Set<string>();

        const counts = {
            existingMbzReleaseGroupIds: 0,
            existingMbzReleaseIds: 0,
        };

        for (const album of meta.albums || []) {
            if (album.mbzReleaseGroupId) {
                ownedMbzReleaseGroupIds.add(album.mbzReleaseGroupId);
                counts.existingMbzReleaseGroupIds++;
            }

            if (album.mbzId) {
                ownedMbzReleaseIds.add(album.mbzId);
                counts.existingMbzReleaseIds++;
            }
        }

        console.log('existingMbzReleaseGroupIds', ownedMbzReleaseGroupIds);
        console.log('existingMbzReleaseIds', ownedMbzReleaseIds);
        console.log('counts', counts);

        const albumArtistName = meta.albumArtist.name;

        // const releaseGroupMap = new Map<
        //     string,
        //     {
        //         release: IRelease;
        //         releaseGroup: NonNullable<IRelease['release-group']>;
        //         score: number;
        //     }
        // >();

        const existingReleaseGroups = new Map<string, IRelease>();
        const existingReleases = new Map<string, IRelease>();
        const unownedReleases = new Map<string, IRelease>();
        const unownedReleaseGroups = new Map<string, IReleaseGroup>();

        for (const release of data.releases.releases) {
            const releaseGroup = release['release-group'];
            const hasReleaseGroup = releaseGroup?.id !== undefined;

            if (hasReleaseGroup && ownedMbzReleaseGroupIds.has(releaseGroup.id)) {
                existingReleaseGroups.set(releaseGroup.id, release);
            }

            if (ownedMbzReleaseIds.has(release.id)) {
                existingReleases.set(release.id, release);
            }
        }

        console.log('existingReleaseGroups', existingReleaseGroups);
        console.log('existingReleases', existingReleases);

        for (const release of data.releases.releases) {
            const releaseGroupId = release['release-group']?.id;
            if (
                releaseGroupId &&
                !ownedMbzReleaseIds.has(release.id) &&
                !ownedMbzReleaseGroupIds.has(releaseGroupId)
            ) {
                unownedReleases.set(release.id, release);
                if (releaseGroupId && release['release-group']) {
                    unownedReleaseGroups.set(releaseGroupId, release['release-group']);
                }
            } else if (!releaseGroupId && !ownedMbzReleaseIds.has(release.id)) {
                console.log('adding unowned release by release id', release.id);
                unownedReleases.set(release.id, release);
            }
        }

        console.log('unownedReleases', unownedReleases);
        console.log('unownedReleaseGroups', unownedReleaseGroups);
        const excludeReleaseTypes = (meta.excludeReleaseTypes ?? []).map((t) => t.toLowerCase());
        const excludeSet = new Set(excludeReleaseTypes);
        const prioritizeCountries = (meta.prioritizeCountries ?? []).map((c) => c.toUpperCase());

        const releaseEntries = Array.from(unownedReleases.entries())
            .filter(([, release]) => {
                if (excludeSet.size === 0) return true;
                const releaseGroup = release['release-group'];
                const primary = releaseGroup?.['primary-type']?.toLowerCase();
                const secondary =
                    releaseGroup?.['secondary-types']?.map((t) => t.toLowerCase()) ?? [];
                const types = [primary, ...secondary].filter(Boolean) as string[];
                return !types.some((t) => excludeSet.has(t));
            })
            .sort(([, a], [, b]) => {
                if (prioritizeCountries.length === 0) return 0;
                const indexA = a.country
                    ? prioritizeCountries.indexOf(a.country.toUpperCase())
                    : -1;
                const indexB = b.country
                    ? prioritizeCountries.indexOf(b.country.toUpperCase())
                    : -1;
                const posA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
                const posB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
                return posA - posB;
            });

        const seenReleaseGroupIds = new Set<string>();
        const releaseEntriesUniqueByGroup = releaseEntries.filter(([, release]) => {
            const releaseGroupId = release['release-group']?.id;
            if (releaseGroupId == null) return true;
            if (seenReleaseGroupIds.has(releaseGroupId)) return false;
            seenReleaseGroupIds.add(releaseGroupId);
            return true;
        });

        const albums: Album[] = releaseEntriesUniqueByGroup
            .map(([releaseId, release]) => {
                const releaseGroup = release['release-group'];
                const hasArtwork =
                    release['cover-art-archive']?.artwork === true &&
                    release['cover-art-archive']?.front === true;

                const primaryReleaseType = releaseGroup?.['primary-type']?.toLowerCase() || null;
                const secondaryReleaseTypes =
                    releaseGroup?.['secondary-types']?.map((type) => type.toLowerCase()) || [];
                const releaseTypes = [primaryReleaseType, ...secondaryReleaseTypes].filter(
                    (type) => type !== null,
                ) as string[];
                const isCompilation = releaseTypes.includes('compilation');
                const originalDate = releaseGroup?.['first-release-date'] || null;
                const originalYear = originalDate ? Number(originalDate.split('-')[0]) : null;
                const releaseDate = release.date ? release.date : null;
                const releaseYear = release.date ? Number(release.date.split('-')[0]) : null;
                const imageUrl = hasArtwork ? getImageUrl(releaseId) : null;

                const album: Album = {
                    _itemType: LibraryItem.ALBUM,
                    _serverId: '',
                    _serverType: ServerType.EXTERNAL,
                    albumArtistName: albumArtistName,
                    albumArtists: [albumArtist],
                    artists: [],
                    comment: null,
                    createdAt: '',
                    duration: null,
                    explicitStatus: null,
                    genres: [],
                    id: `musicbrainz-${release.id}`,
                    imageId: null,
                    imageUrl: imageUrl,
                    isCompilation: isCompilation,
                    lastPlayedAt: null,
                    mbzId: release.id,
                    mbzReleaseGroupId: releaseGroup?.id || null,
                    name: release.title,
                    originalDate: originalDate,
                    originalYear: originalYear,
                    participants: {},
                    playCount: null,
                    recordLabels: [],
                    releaseDate: releaseDate,
                    releaseType: primaryReleaseType,
                    releaseTypes: releaseTypes,
                    releaseYear: releaseYear,
                    size: null,
                    songCount: null,
                    sortName: release.title,
                    tags: {},
                    updatedAt: '',
                    userFavorite: false,
                    userRating: null,
                    version: null,
                };

                return album;
            })
            .filter((album): album is Album => album !== null);

        return albums;
    },
);

async function fetchAllReleases(mbzArtistId: string): Promise<IBrowseReleasesResult> {
    const PAGE_SIZE = 100;
    const includes: Array<'media' | 'release-groups'> = ['media', 'release-groups'];

    // Fetch first page to get total count
    const firstPage = (await musicbrainzApi.browse(
        'release',
        {
            artist: mbzArtistId,
            limit: PAGE_SIZE,
            offset: 0,
        },
        includes,
    )) as unknown as IBrowseReleasesResult;

    const totalCount = firstPage['release-count'];
    const allReleases = [...firstPage.releases];

    // If we got all releases in the first page, return early
    if (allReleases.length >= totalCount) {
        return firstPage;
    }

    // Calculate number of additional pages needed
    const remainingCount = totalCount - allReleases.length;
    const numberOfPages = Math.ceil(remainingCount / PAGE_SIZE);

    // Fetch all remaining pages in parallel
    const pagePromises = Array.from({ length: numberOfPages }, (_, i) => {
        const offset = (i + 1) * PAGE_SIZE;
        return musicbrainzApi.browse(
            'release',
            {
                artist: mbzArtistId,
                limit: PAGE_SIZE,
                offset: offset,
            },
            includes,
        ) as unknown as Promise<IBrowseReleasesResult>;
    });

    const remainingPages = await Promise.all(pagePromises);

    for (const page of remainingPages) {
        allReleases.push(...page.releases);
    }

    return {
        'release-count': totalCount,
        'release-offset': 0,
        releases: allReleases,
    };
}

export const musicbrainzQueries = {
    artist: (args: {
        excludeReleaseTypes?: string[];
        mbzArtistId: string;
        prioritizeCountries?: string[];
    }) => {
        const config = {
            excludeReleaseTypes: args.excludeReleaseTypes ?? [],
            prioritizeCountries: args.prioritizeCountries ?? [],
        };

        return queryOptions({
            gcTime: CACHE_TIME,
            queryFn: async ({ meta }) => {
                const artist = await musicbrainzApi.lookup('artist', args.mbzArtistId);
                const releases = await fetchAllReleases(args.mbzArtistId);

                return {
                    data: { artist, releases },
                    meta: meta as MusicBrainzArtistSelectMeta,
                };
            },
            queryKey: queryKeys.musicbrainz.artist(undefined, args.mbzArtistId, config),
            select: artistSelect,
            staleTime: CACHE_TIME,
        });
    },
};

function getImageUrl(releaseId: string): string {
    return `https://coverartarchive.org/release/${releaseId}/front-250.jpg`;
}

function getImageUrlByReleaseGroupId(releaseGroupId: string): string {
    return `https://coverartarchive.org/release-group/${releaseGroupId}/front-250.jpg`;
}

const MBZ_COUNTRY_CODES = {
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

const MBZ_RELEASE_TYPES = {
    album: 'album',
    audiobook: 'audiobook',
    'audio drama': 'audio drama',
    broadcast: 'broadcast',
    compilation: 'compilation',
    demo: 'demo',
    'dj-mix': 'dj-mix',
    ep: 'ep',
    'field recording': 'field recording',
    interview: 'interview',
    live: 'live',
    'mixtape/street': 'mixtape/street',
    other: 'other',
    remix: 'remix',
    single: 'single',
    soundtrack: 'soundtrack',
    spokenword: 'spokenword',
};
