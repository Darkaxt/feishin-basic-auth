import { IArtist, IMedium, IRelease, ITrack, IWork } from 'musicbrainz-api';

import {
    IRelationWithWork,
    MUSICBRAINZ_ID_PREFIX,
} from '/@/renderer/features/musicbrainz/api/musicbrainz-api';
import { Album, LibraryItem, RelatedArtist, ServerType, Song } from '/@/shared/types/domain-types';

export function collectWorksFromRelease(release: IRelease): IWork[] {
    const works: IWork[] = [];
    const seenIds = new Set<string>();

    for (const medium of release.media ?? []) {
        for (const track of medium.tracks ?? []) {
            const recording = track.recording;
            const relations = (recording as { relations?: IRelationWithWork[] })?.relations ?? [];
            for (const rel of relations) {
                const work = (rel as IRelationWithWork).work;
                if (work?.id && !seenIds.has(work.id)) {
                    seenIds.add(work.id);
                    works.push(work);
                }
            }
        }
    }

    return works;
}

export function getImageUrl(releaseId: string): string {
    return `https://coverartarchive.org/release/${releaseId}/front-250.jpg`;
}
export function getMbzReleaseIdFromAlbumId(albumId: string): null | string {
    if (!albumId.startsWith(MUSICBRAINZ_ID_PREFIX)) return null;
    return albumId.slice(MUSICBRAINZ_ID_PREFIX.length);
}
// function getImageUrlByReleaseGroupId(releaseGroupId: string): string {
//     return `https://coverartarchive.org/release-group/${releaseGroupId}/front-250.jpg`;
// }

// const MBZ_COUNTRY_CODES = {
//     AD: 'Andorra',
//     AE: 'United Arab Emirates',
//     AF: 'Afghanistan',
//     AG: 'Antigua and Barbuda',
//     AI: 'Anguilla',
//     AL: 'Albania',
//     AM: 'Armenia',
//     AN: 'Netherlands Antilles',
//     AO: 'Angola',
//     AQ: 'Antarctica',
//     AR: 'Argentina',
//     AS: 'American Samoa',
//     AT: 'Austria',
//     AU: 'Australia',
//     AW: 'Aruba',
//     AX: 'Åland Islands',
//     AZ: 'Azerbaijan',
//     BA: 'Bosnia and Herzegovina',
//     BB: 'Barbados',
//     BD: 'Bangladesh',
//     BE: 'Belgium',
//     BF: 'Burkina Faso',
//     BG: 'Bulgaria',
//     BH: 'Bahrain',
//     BI: 'Burundi',
//     BJ: 'Benin',
//     BL: 'Saint Barthélemy',
//     BM: 'Bermuda',
//     BN: 'Brunei',
//     BO: 'Bolivia',
//     BQ: 'Bonaire, Sint Eustatius and Saba',
//     BR: 'Brazil',
//     BS: 'Bahamas',
//     BT: 'Bhutan',
//     BV: 'Bouvet Island',
//     BW: 'Botswana',
//     BY: 'Belarus',
//     BZ: 'Belize',
//     CA: 'Canada',
//     CC: 'Cocos (Keeling) Islands',
//     CD: 'Democratic Republic of the Congo',
//     CF: 'Central African Republic',
//     CG: 'Congo',
//     CH: 'Switzerland',
//     CI: "Côte d'Ivoire",
//     CK: 'Cook Islands',
//     CL: 'Chile',
//     CM: 'Cameroon',
//     CN: 'China',
//     CO: 'Colombia',
//     CR: 'Costa Rica',
//     CS: 'Serbia and Montenegro',
//     CU: 'Cuba',
//     CV: 'Cape Verde',
//     CW: 'Curaçao',
//     CX: 'Christmas Island',
//     CY: 'Cyprus',
//     CZ: 'Czechia',
//     DE: 'Germany',
//     DJ: 'Djibouti',
//     DK: 'Denmark',
//     DM: 'Dominica',
//     DO: 'Dominican Republic',
//     DZ: 'Algeria',
//     EC: 'Ecuador',
//     EE: 'Estonia',
//     EG: 'Egypt',
//     EH: 'Western Sahara',
//     ER: 'Eritrea',
//     ES: 'Spain',
//     ET: 'Ethiopia',
//     FI: 'Finland',
//     FJ: 'Fiji',
//     FK: 'Falkland Islands',
//     FM: 'Federated States of Micronesia',
//     FO: 'Faroe Islands',
//     FR: 'France',
//     GA: 'Gabon',
//     GB: 'United Kingdom',
//     GD: 'Grenada',
//     GE: 'Georgia',
//     GF: 'French Guiana',
//     GG: 'Guernsey',
//     GH: 'Ghana',
//     GI: 'Gibraltar',
//     GL: 'Greenland',
//     GM: 'Gambia',
//     GN: 'Guinea',
//     GP: 'Guadeloupe',
//     GQ: 'Equatorial Guinea',
//     GR: 'Greece',
//     GS: 'South Georgia and the South Sandwich Islands',
//     GT: 'Guatemala',
//     GU: 'Guam',
//     GW: 'Guinea-Bissau',
//     GY: 'Guyana',
//     HK: 'Hong Kong',
//     HM: 'Heard Island and McDonald Islands',
//     HN: 'Honduras',
//     HR: 'Croatia',
//     HT: 'Haiti',
//     HU: 'Hungary',
//     ID: 'Indonesia',
//     IE: 'Ireland',
//     IL: 'Israel',
//     IM: 'Isle of Man',
//     IN: 'India',
//     IO: 'British Indian Ocean Territory',
//     IQ: 'Iraq',
//     IR: 'Iran',
//     IS: 'Iceland',
//     IT: 'Italy',
//     JE: 'Jersey',
//     JM: 'Jamaica',
//     JO: 'Jordan',
//     JP: 'Japan',
//     KE: 'Kenya',
//     KG: 'Kyrgyzstan',
//     KH: 'Cambodia',
//     KI: 'Kiribati',
//     KM: 'Comoros',
//     KN: 'Saint Kitts and Nevis',
//     KP: 'North Korea',
//     KR: 'South Korea',
//     KW: 'Kuwait',
//     KY: 'Cayman Islands',
//     KZ: 'Kazakhstan',
//     LA: 'Laos',
//     LB: 'Lebanon',
//     LC: 'Saint Lucia',
//     LI: 'Liechtenstein',
//     LK: 'Sri Lanka',
//     LR: 'Liberia',
//     LS: 'Lesotho',
//     LT: 'Lithuania',
//     LU: 'Luxembourg',
//     LV: 'Latvia',
//     LY: 'Libya',
//     MA: 'Morocco',
//     MC: 'Monaco',
//     MD: 'Moldova',
//     ME: 'Montenegro',
//     MF: 'Saint Martin (French part)',
//     MG: 'Madagascar',
//     MH: 'Marshall Islands',
//     MK: 'North Macedonia',
//     ML: 'Mali',
//     MM: 'Myanmar',
//     MN: 'Mongolia',
//     MO: 'Macao',
//     MP: 'Northern Mariana Islands',
//     MQ: 'Martinique',
//     MR: 'Mauritania',
//     MS: 'Montserrat',
//     MT: 'Malta',
//     MU: 'Mauritius',
//     MV: 'Maldives',
//     MW: 'Malawi',
//     MX: 'Mexico',
//     MY: 'Malaysia',
//     MZ: 'Mozambique',
//     NA: 'Namibia',
//     NC: 'New Caledonia',
//     NE: 'Niger',
//     NF: 'Norfolk Island',
//     NG: 'Nigeria',
//     NI: 'Nicaragua',
//     NL: 'Netherlands',
//     NO: 'Norway',
//     NP: 'Nepal',
//     NR: 'Nauru',
//     NU: 'Niue',
//     NZ: 'New Zealand',
//     OM: 'Oman',
//     PA: 'Panama',
//     PE: 'Peru',
//     PF: 'French Polynesia',
//     PG: 'Papua New Guinea',
//     PH: 'Philippines',
//     PK: 'Pakistan',
//     PL: 'Poland',
//     PM: 'Saint Pierre and Miquelon',
//     PN: 'Pitcairn',
//     PR: 'Puerto Rico',
//     PS: 'Palestine',
//     PT: 'Portugal',
//     PW: 'Palau',
//     PY: 'Paraguay',
//     QA: 'Qatar',
//     RE: 'Réunion',
//     RO: 'Romania',
//     RS: 'Serbia',
//     RU: 'Russia',
//     RW: 'Rwanda',
//     SA: 'Saudi Arabia',
//     SB: 'Solomon Islands',
//     SC: 'Seychelles',
//     SD: 'Sudan',
//     SE: 'Sweden',
//     SG: 'Singapore',
//     SH: 'Saint Helena, Ascension and Tristan da Cunha',
//     SI: 'Slovenia',
//     SJ: 'Svalbard and Jan Mayen',
//     SK: 'Slovakia',
//     SL: 'Sierra Leone',
//     SM: 'San Marino',
//     SN: 'Senegal',
//     SO: 'Somalia',
//     SR: 'Suriname',
//     SS: 'South Sudan',
//     ST: 'Sao Tome and Principe',
//     SU: 'Soviet Union',
//     SV: 'El Salvador',
//     SX: 'Sint Maarten (Dutch part)',
//     SY: 'Syria',
//     SZ: 'Eswatini',
//     TC: 'Turks and Caicos Islands',
//     TD: 'Chad',
//     TF: 'French Southern Territories',
//     TG: 'Togo',
//     TH: 'Thailand',
//     TJ: 'Tajikistan',
//     TK: 'Tokelau',
//     TL: 'Timor-Leste',
//     TM: 'Turkmenistan',
//     TN: 'Tunisia',
//     TO: 'Tonga',
//     TR: 'Turkey',
//     TT: 'Trinidad and Tobago',
//     TV: 'Tuvalu',
//     TW: 'Taiwan',
//     TZ: 'Tanzania',
//     UA: 'Ukraine',
//     UG: 'Uganda',
//     UM: 'United States Minor Outlying Islands',
//     US: 'United States',
//     UY: 'Uruguay',
//     UZ: 'Uzbekistan',
//     VA: 'Vatican City',
//     VC: 'Saint Vincent and The Grenadines',
//     VE: 'Venezuela',
//     VG: 'British Virgin Islands',
//     VI: 'U.S. Virgin Islands',
//     VN: 'Vietnam',
//     VU: 'Vanuatu',
//     WF: 'Wallis and Futuna',
//     WS: 'Samoa',
//     XC: 'Czechoslovakia',
//     XE: 'Europe',
//     XG: 'East Germany',
//     XK: 'Kosovo',
//     XW: '[Worldwide]',
//     YE: 'Yemen',
//     YT: 'Mayotte',
//     YU: 'Yugoslavia',
//     ZA: 'South Africa',
//     ZM: 'Zambia',
//     ZW: 'Zimbabwe',
// };

// const MBZ_RELEASE_TYPES = {
//     album: 'album',
//     audiobook: 'audiobook',
//     'audio drama': 'audio drama',
//     broadcast: 'broadcast',
//     compilation: 'compilation',
//     demo: 'demo',
//     'dj-mix': 'dj-mix',
//     ep: 'ep',
//     'field recording': 'field recording',
//     interview: 'interview',
//     live: 'live',
//     'mixtape/street': 'mixtape/street',
//     other: 'other',
//     remix: 'remix',
//     single: 'single',
//     soundtrack: 'soundtrack',
//     spokenword: 'spokenword',
// };

export function isMbzAlbumId(albumId: string): boolean {
    return albumId.startsWith(MUSICBRAINZ_ID_PREFIX);
}
export function normalizeReleaseToAlbum(release: IRelease): Album {
    const releaseGroup = release['release-group'];
    const artistCredit = release['artist-credit'] ?? releaseGroup?.['artist-credit'] ?? [];
    const albumArtistName = artistCredit
        .map((entry) => `${entry.name}${entry.joinphrase ?? ''}`)
        .join(' ');
    const albumArtists: RelatedArtist[] = (artistCredit as { artist: IArtist; name: string }[]).map(
        (ac) => ({
            id: `musicbrainz-${ac.artist.id}`,
            imageId: null,
            imageUrl: null,
            name: ac.name || ac.artist.name,
            userFavorite: false,
            userRating: null,
        }),
    );

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
    const imageUrl = hasArtwork ? getImageUrl(release.id) : null;
    const albumId = `musicbrainz-${release.id}`;

    const songs: Song[] = [];
    for (const medium of release.media ?? []) {
        for (const track of medium.tracks ?? []) {
            songs.push(
                normalizeRecordingToSong(
                    release,
                    medium,
                    track,
                    albumArtistName,
                    albumArtists,
                    albumId,
                    imageUrl,
                    releaseDate,
                    releaseYear,
                ),
            );
        }
    }

    const totalDuration = songs.reduce((sum, s) => sum + s.duration, 0);

    return {
        _itemType: LibraryItem.ALBUM,
        _serverId: 'musicbrainz',
        _serverType: ServerType.EXTERNAL,
        albumArtistName,
        albumArtists,
        artists: [],
        comment: null,
        createdAt: '',
        duration: totalDuration || null,
        explicitStatus: null,
        genres: [],
        id: albumId,
        imageId: null,
        imageUrl,
        isCompilation,
        lastPlayedAt: null,
        mbzId: release.id,
        mbzReleaseGroupId: releaseGroup?.id || null,
        name: release.title,
        originalDate,
        originalYear,
        participants: {},
        playCount: null,
        recordLabels: [],
        releaseDate,
        releaseType: primaryReleaseType,
        releaseTypes,
        releaseYear,
        size: null,
        songCount: songs.length,
        songs,
        sortName: release.title,
        tags: {},
        updatedAt: '',
        userFavorite: false,
        userRating: null,
        version: null,
    };
}
function normalizeArtistCreditToRelatedArtists(
    artistCredit: Array<{ artist: IArtist; name: string }>,
): RelatedArtist[] {
    return artistCredit.map((ac) => ({
        id: `musicbrainz-${ac.artist.id}`,
        imageId: null,
        imageUrl: null,
        name: ac.name || ac.artist.name,
        userFavorite: false,
        userRating: null,
    }));
}
function normalizeRecordingToSong(
    release: IRelease,
    medium: IMedium,
    track: ITrack,
    albumArtistName: string,
    albumArtists: RelatedArtist[],
    albumId: string,
    imageUrl: null | string,
    releaseDate: null | string,
    releaseYear: null | number,
): Song {
    const recording = track.recording;
    const trackArtistCredit = track['artist-credit'] ?? recording['artist-credit'] ?? [];

    const artistName = trackArtistCredit
        .map((entry) => `${entry.name}${entry.joinphrase ?? ''}`)
        .join(' ');

    const artists = normalizeArtistCreditToRelatedArtists(
        trackArtistCredit as Array<{ artist: IArtist; name: string }>,
    );

    const durationMilliseconds = track.length || recording.length || 0;
    const trackNumber = track.position || parseInt(track.number, 10) || 0;

    return {
        _itemType: LibraryItem.SONG,
        _serverId: 'musicbrainz',
        _serverType: ServerType.EXTERNAL,
        album: release.title,
        albumArtistName,
        albumArtists,
        albumId,
        artistName,
        artists,
        bitDepth: null,
        bitRate: 0,
        bpm: null,
        channels: null,
        comment: null,
        compilation: null,
        container: null,
        createdAt: '',
        discNumber: medium.position || 1,
        discSubtitle: medium.title || null,
        duration: durationMilliseconds,
        explicitStatus: null,
        gain: null,
        genres: [],
        id: `musicbrainz-${release.id}-${recording.id}-${track.position}-${track.number}`,
        imageId: null,
        imageUrl,
        lastPlayedAt: null,
        lyrics: null,
        mbzRecordingId: recording.id,
        mbzTrackId: track.id,
        name: track.title || recording.title,
        participants: {},
        path: null,
        peak: null,
        playCount: 0,
        releaseDate,
        releaseYear,
        sampleRate: null,
        size: 0,
        sortName: track.title || recording.title,
        tags: null,
        trackNumber,
        trackSubtitle: null,
        updatedAt: '',
        userFavorite: false,
        userRating: null,
    };
}
