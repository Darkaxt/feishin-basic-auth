import { components } from './subsonic-schema.d';

import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import { Album } from '/@/shared/types/domain/album-domain-types';
import { Artist, RelatedArtist } from '/@/shared/types/domain/artist-domain-types';
import { Genre, RelatedGenre } from '/@/shared/types/domain/genre-domain-types';
import { Playlist } from '/@/shared/types/domain/playlist-domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';
import { Song } from '/@/shared/types/domain/song-domain-types';
import { formatDate } from '/@/shared/utils/format-date';

export const normalize = {
    album: (
        item: components['schemas']['AlbumID3'] | components['schemas']['AlbumID3WithSongs'],
        server: ServerListItem,
    ): Album => {
        const imageUrl = item.coverArt ? getCoverArtUrl(item.coverArt, server) : null;

        return {
            _itemType: LibraryItem.ALBUM,
            _serverId: server?.id || 'unknown',
            _serverType: ServerType.SUBSONIC,
            artistName: item.artist || null,
            artists: getArtistList(item.artists, item.artistId, item.artist),
            comment: null,
            createdDate: item.created,
            discTitles: getDiscTitles(item),
            displayArtist: null,
            duration: getDuration(item.duration),
            explicit: item.explicitStatus === 'explicit',
            genres: getGenres(item),
            id: item.id.toString(),
            imagePlaceholderUrl: null,
            imageUrl,
            isCompilation: item.isCompilation || null,
            mbzId: item.musicBrainzId || null,
            mbzReleaseGroupId: null,
            missing: null,
            moods: getMoods(item),
            name: item.name,
            originalReleaseDate: getOriginalReleaseDate(item),
            participants: {},
            recordLabels: getRecordLabels(item),
            releaseDate: getReleaseDate(item),
            releaseTypes: getReleaseTypes(item),
            releaseYear: item.year || null,
            size: null,
            songCount: item.songCount,
            sortName: item.sortName || item.name,
            tags: {},
            updatedDate: null,
            userFavorite: Boolean(item.starred),
            userFavoriteDate: item.starred || null,
            userLastPlayedDate: item.played || null,
            userPlayCount: item.playCount ?? null,
            userRating: item.userRating || null,
            version: item.version || null,
        };
    },
    albumArtist: (
        item: components['schemas']['ArtistID3'] & components['schemas']['ArtistInfo2'],
        server: ServerListItem,
    ): Artist => {
        return {
            _serverId: server?.id || 'unknown',
            _serverType: ServerType.SUBSONIC,
            albumCount: item.albumCount ? Number(item.albumCount) : 0,
            biography: item.biography || null,
            duration: null,
            genres: [],
            id: item.id.toString(),
            imageUrl: item.coverArt ? getCoverArtUrl(item.coverArt.toString(), server) : null,
            itemType: LibraryItem.ALBUM_ARTIST,
            mbzId: item.musicBrainzId || null,
            name: item.name,
            playCount: null,
            similarArtists: [],
            songCount: null,
            userFavorite: false,
            userLastPlayedDate: null,
            userRating: null,
        };
    },
    genre: (item: components['schemas']['Genre'], server: ServerListItem): Genre => {
        return {
            _itemType: LibraryItem.GENRE,
            _serverId: server.id,
            _serverType: ServerType.SUBSONIC,
            albumCount: item.albumCount,
            id: item.value,
            imageUrl: null,
            name: item.value,
            songCount: item.songCount,
        };
    },
    playlist: (item: components['schemas']['Playlist'], server: ServerListItem): Playlist => {
        return {
            _itemType: LibraryItem.PLAYLIST,
            _serverId: server.id,
            _serverType: ServerType.SUBSONIC,
            createdDate: item.created || null,
            description: item.comment || null,
            duration: getDuration(item.duration),
            genres: [],
            id: item.id.toString(),
            imageUrl: item.coverArt ? getCoverArtUrl(item.coverArt.toString(), server) : null,
            name: item.name,
            owner: item.owner || null,
            ownerId: item.owner || null,
            public: item.public || null,
            size: null,
            songCount: item.songCount,
            updatedDate: item.changed,
        };
    },
    song: (item: components['schemas']['Child'], server: ServerListItem): Song => {
        return {
            _itemType: LibraryItem.SONG,
            _serverId: server.id,
            _serverType: ServerType.SUBSONIC,
            album: item.album || null,
            albumArtistName: item.displayAlbumArtist || null,
            albumArtists: getArtistList(item.albumArtists, item.artistId, item.artist),
            albumId: item.albumId || null,
            artistName: item.displayArtist || item.artist || null,
            artists: getArtistList(item.artists, item.artistId, item.artist),
            bitDepth: item.bitDepth || null,
            bitRate: item.bitRate || null,
            bpm: item.bpm || null,
            channels: item.channelCount || null,
            comment: item.comment || null,
            composer: item.displayComposer || null,
            container: item.contentType || null,
            createdDate: item.created || null,
            discNumber: item.discNumber || 1,
            discSubtitle: null,
            duration: getDuration(item.duration),
            explicit: item.explicitStatus === 'explicit',
            gain: getGainInfo(item),
            genres: getGenres(item),
            id: item.id.toString(),
            imageUrl: item.coverArt ? getCoverArtUrl(item.coverArt, server) : null,
            isCompilation: null,
            isrc: item.isrc || [],
            lyrics: null,
            mbzId: item.musicBrainzId || null,
            missing: false,
            moods: getMoods(item),
            name: item.title,
            participants: getParticipants(item),
            path: item.path || null,
            peak: getPeakInfo(item),
            playCount: item?.playCount || 0,
            releaseDate: null,
            releaseYear: item.year ?? null,
            samplingRate: item.samplingRate || null,
            size: item.size ?? 0,
            sortName: item.sortName || item.title,
            streamUrl: getStreamUrl(item.id, server),
            tags: {},
            trackNumber: item.track || 1,
            updatedDate: null,
            userFavorite: Boolean(item.starred),
            userFavoriteDate: item.starred || null,
            userLastPlayedDate: item.played || null,
            userRating: item.userRating || null,
        };
    },
};

function getArtistList(
    artists?: typeof ssType._response.song._type.artists,
    artistId?: number | string,
    artistName?: string,
) {
    return artists
        ? artists.map((item) => ({
              id: item.id.toString(),
              imageUrl: null,
              name: item.name,
          }))
        : [
              {
                  id: artistId?.toString() || '',
                  imageUrl: null,
                  name: artistName || '',
              },
          ];
}

function getCoverArtUrl(id: string, server: ServerListItem) {
    return (
        `${server.url}/rest/getCoverArt.view` +
        `?id=${id}` +
        `&${server.credential}` +
        '&v=1.16.1' +
        '&c=Feishin'
    );
}

function getDiscTitles(
    item: components['schemas']['AlbumID3'] | components['schemas']['AlbumID3WithSongs'],
) {
    return (item.discTitles || []).map((discTitle) => ({
        disc: discTitle.disc,
        title: discTitle.title,
    }));
}

function getDuration(duration?: number) {
    // Transform from seconds to milliseconds
    return duration ? duration * 1000 : 0;
}

function getGainInfo(item: components['schemas']['Child']) {
    return item.replayGain && (item.replayGain.albumGain || item.replayGain.trackGain)
        ? {
              album: item.replayGain.albumGain,
              track: item.replayGain.trackGain,
          }
        : null;
}

function getGenres(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
): RelatedGenre[] {
    if (item.genres) {
        return item.genres.map((genre) => ({
            id: genre.name,
            imageUrl: null,
            name: genre.name,
        }));
    }

    if (item.genre) {
        return [
            {
                id: item.genre,
                imageUrl: null,
                name: item.genre,
            },
        ];
    }

    return [];
}

function getMoods(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    return (item.moods || []).map((mood) => ({
        id: mood,
        name: mood,
    }));
}

function getOriginalReleaseDate(
    item: components['schemas']['AlbumID3'] | components['schemas']['AlbumID3WithSongs'],
) {
    return item.originalReleaseDate
        ? formatDate.toUTCDate(
              `${item.originalReleaseDate.year}-${item.originalReleaseDate.month}-${item.originalReleaseDate.day}`,
          )
        : null;
}

function getParticipants(item: components['schemas']['Child']) {
    const participants: Record<string, RelatedArtist[]> = {};

    if (item.contributors) {
        for (const contributor of item.contributors) {
            const artist = {
                id: contributor.artist.id?.toString() || '',
                imageUrl: null,
                name: contributor.artist.name || '',
            };

            const role = contributor.subRole
                ? `${contributor.role} (${contributor.subRole})`
                : contributor.role;

            if (!participants[role]) {
                participants[role] = [];
            }

            participants[role].push(artist);
        }
    }

    return participants;
}

function getPeakInfo(item: components['schemas']['Child']) {
    return item.replayGain && (item.replayGain.albumPeak || item.replayGain.trackPeak)
        ? {
              album: item.replayGain.albumPeak,
              track: item.replayGain.trackPeak,
          }
        : null;
}

function getRecordLabels(
    item: components['schemas']['AlbumID3'] | components['schemas']['AlbumID3WithSongs'],
) {
    return (item.recordLabels || []).map((recordLabel) => ({
        id: recordLabel.name,
        name: recordLabel.name,
    }));
}

function getReleaseDate(
    item: components['schemas']['AlbumID3'] | components['schemas']['AlbumID3WithSongs'],
) {
    return item.releaseDate
        ? formatDate.toUTCDate(
              `${item.releaseDate.year}-${item.releaseDate.month}-${item.releaseDate.day}`,
          )
        : null;
}

function getReleaseTypes(
    item: components['schemas']['AlbumID3'] | components['schemas']['AlbumID3WithSongs'],
) {
    return (item.releaseTypes || []).map((releaseType) => ({
        id: releaseType,
        name: releaseType,
    }));
}

function getStreamUrl(id: string, server: ServerListItem) {
    return `${server.url}/rest/stream.view?id=${id}&v=1.16.1&c=Feishin&${server.credential}`;
}
