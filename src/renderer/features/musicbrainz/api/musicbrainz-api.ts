import { queryOptions } from '@tanstack/react-query';
import memoize from 'lodash/memoize';
import {
    IArtist,
    IBrowseReleasesResult,
    IRelation,
    IRelease,
    IReleaseGroup,
    IWork,
    MusicBrainzApi,
} from 'musicbrainz-api';

import packageJson from '../../../../../package.json';

import { queryKeys } from '/@/renderer/api/query-keys';
import {
    collectWorksFromRelease,
    getImageUrl,
    normalizeReleaseToAlbum,
} from '/@/renderer/features/musicbrainz/utils';
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

export type IRelationWithWork = IRelation & { work?: IWork };

export type MusicBrainzArtistSelectMeta = {
    albumArtist: AlbumArtist;
    albums?: Album[];
    excludeReleaseTypes?: string[];
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

        const albumArtistName = meta.albumArtist.name;

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
                    _serverId: 'musicbrainz',
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

async function fetchMbzReleasesByArtistId(mbzArtistId: string): Promise<IBrowseReleasesResult> {
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

    if (allReleases.length >= totalCount) {
        return firstPage;
    }

    const remainingCount = totalCount - allReleases.length;
    const numberOfPages = Math.ceil(remainingCount / PAGE_SIZE);

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

const RELEASE_INCLUDES: Array<
    | 'artist-credits'
    | 'artists'
    | 'media'
    | 'recording-level-rels'
    | 'recordings'
    | 'release-groups'
> = ['artist-credits', 'artists', 'media', 'recording-level-rels', 'recordings', 'release-groups'];

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
                const releases = await fetchMbzReleasesByArtistId(args.mbzArtistId);

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
    release: (args: { releaseId: string }) =>
        queryOptions({
            gcTime: CACHE_TIME,
            queryFn: async () => {
                const mbzRelease = await musicbrainzApi.lookup(
                    'release',
                    args.releaseId,
                    RELEASE_INCLUDES,
                );
                const release = normalizeReleaseToAlbum(mbzRelease);
                const works = collectWorksFromRelease(mbzRelease);
                return { release, works };
            },
            queryKey: queryKeys.musicbrainz.release(args.releaseId),
            staleTime: CACHE_TIME,
        }),
};

export const MUSICBRAINZ_ID_PREFIX = 'musicbrainz-';

export async function fetchMbzReleaseAsAlbum(releaseId: string): Promise<Album> {
    const mbzRelease = await musicbrainzApi.lookup('release', releaseId, RELEASE_INCLUDES);
    return normalizeReleaseToAlbum(mbzRelease);
}
