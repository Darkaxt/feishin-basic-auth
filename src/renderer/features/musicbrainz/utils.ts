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

export function getImageUrlByReleaseGroupId(releaseGroupId: string): string {
    return `https://coverartarchive.org/release-group/${releaseGroupId}/front-250.jpg`;
}

export function getMbzReleaseIdFromAlbumId(albumId: string): null | string {
    if (!albumId.startsWith(MUSICBRAINZ_ID_PREFIX)) return null;
    return albumId.slice(MUSICBRAINZ_ID_PREFIX.length);
}

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

    const hasArtwork = releaseGroup;
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
    const imageUrl = hasArtwork ? getImageUrlByReleaseGroupId(releaseGroup.id) : null;
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
