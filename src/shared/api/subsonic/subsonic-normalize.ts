import { components, paths } from './subsonic-schema.d';

import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import { Album, AlbumListSortOptions } from '/@/shared/types/domain/album-domain-types';
import { Artist, RelatedArtist } from '/@/shared/types/domain/artist-domain-types';
import { Genre, RelatedGenre } from '/@/shared/types/domain/genre-domain-types';
import { Playlist } from '/@/shared/types/domain/playlist-domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';
import { Song } from '/@/shared/types/domain/song-domain-types';
import { User } from '/@/shared/types/domain/user-domain-types';
import { formatDate } from '/@/shared/utils/format-date';

type AlbumSortType = paths['/rest/getAlbumList2']['get']['parameters']['query']['type'];

const defaultSortType: AlbumSortType = 'alphabeticalByName';

const albumSortByMap: Record<AlbumListSortOptions, AlbumSortType> = {
    [AlbumListSortOptions.ALBUM_ARTIST]: 'alphabeticalByArtist',
    [AlbumListSortOptions.ARTIST]: defaultSortType,
    [AlbumListSortOptions.COMMUNITY_RATING]: defaultSortType,
    [AlbumListSortOptions.CRITIC_RATING]: defaultSortType,
    [AlbumListSortOptions.DATE_ADDED]: 'newest',
    [AlbumListSortOptions.DATE_PLAYED]: 'recent',
    [AlbumListSortOptions.DURATION]: defaultSortType,
    [AlbumListSortOptions.IS_FAVORITE]: defaultSortType,
    [AlbumListSortOptions.NAME]: 'alphabeticalByName',
    [AlbumListSortOptions.PLAY_COUNT]: 'frequent',
    [AlbumListSortOptions.RANDOM]: defaultSortType,
    [AlbumListSortOptions.RATING]: 'highest',
    [AlbumListSortOptions.RELEASE_DATE]: defaultSortType,
    [AlbumListSortOptions.TRACK_COUNT]: defaultSortType,
    [AlbumListSortOptions.YEAR]: defaultSortType,
};

export const normalize = {
    _sort: {
        album: (option: AlbumListSortOptions) => {
            return albumSortByMap[option] || defaultSortType;
        },
    },
    album: (
        item:
            | components['schemas']['AlbumID3']
            | components['schemas']['AlbumID3WithSongs']
            | components['schemas']['Child'],
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
            createdDate: item.created || null,
            discTitles: getDiscTitles(item),
            displayArtist: null,
            duration: getDuration(item.duration),
            explicit: item.explicitStatus === 'explicit',
            genres: getGenres(item),
            id: item.id.toString(),
            imageUrl,
            isCompilation: getIsCompilation(item),
            mbzId: item.musicBrainzId || null,
            mbzReleaseGroupId: null,
            missing: null,
            moods: getMoods(item),
            name: getName(item),
            originalReleaseDate: getOriginalReleaseDate(item),
            participants: {},
            recordLabels: getRecordLabels(item),
            releaseDate: getReleaseDate(item),
            releaseTypes: getReleaseTypes(item),
            releaseYear: item.year || null,
            size: null,
            songCount: 'songCount' in item ? item.songCount : null,
            sortName: getSortName(item),
            tags: {},
            updatedDate: null,
            userFavorite: Boolean(item.starred),
            userFavoriteDate: item.starred || null,
            userLastPlayedDate: item.played || null,
            userPlayCount: item.playCount ?? null,
            userRating: item.userRating || null,
            version: 'version' in item ? item.version || null : null,
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
    user: (item: components['schemas']['User'], server: ServerListItem): User => {
        return {
            _itemType: LibraryItem.USER,
            _serverId: server.id,
            _serverType: ServerType.SUBSONIC,
            id: item.username,
            permissions: {
                'jukebox.manage': item.jukeboxRole,
                'media.download': item.downloadRole,
                'media.folder': item.folder?.map((folder) => folder.toString()) || [],
                'media.share': item.shareRole,
                'media.stream': item.streamRole,
                'media.upload': item.uploadRole,
                'playlist.create': item.playlistRole,
                'playlist.delete': item.playlistRole,
                'playlist.edit': item.playlistRole,
                'server.admin': item.adminRole,
                'user.edit': item.settingsRole,
            },
            username: item.username,
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
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('discTitles' in item) {
        return (item.discTitles || []).map((discTitle) => ({
            disc: discTitle.disc,
            title: discTitle.title,
        }));
    }

    return [];
}

function getDuration(duration?: number) {
    // Transform from seconds to milliseconds
    return duration ? duration * 1000 : 0;
}

function getGainInfo(item: components['schemas']['Child']) {
    if ('replayGain' in item) {
        return item.replayGain && (item.replayGain.albumGain || item.replayGain.trackGain)
            ? {
                  album: item.replayGain.albumGain,
                  track: item.replayGain.trackGain,
              }
            : null;
    }

    return null;
}

function getGenres(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
): RelatedGenre[] {
    if ('genres' in item) {
        return (item.genres || []).map((genre) => ({
            id: genre.name,
            imageUrl: null,
            name: genre.name,
        }));
    }

    if ('genre' in item) {
        if (!item.genre) {
            return [];
        }

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

function getIsCompilation(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('isCompilation' in item) {
        return item.isCompilation || null;
    }

    return null;
}

function getMoods(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('moods' in item) {
        return (item.moods || []).map((mood) => ({
            id: mood,
            name: mood,
        }));
    }

    return [];
}

function getName(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('name' in item) {
        return item.name || '';
    }

    if ('title' in item) {
        return item.title || '';
    }

    return '';
}

function getOriginalReleaseDate(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('originalReleaseDate' in item) {
        return item.originalReleaseDate
            ? formatDate.toUTCDate(
                  `${item.originalReleaseDate.year}-${item.originalReleaseDate.month}-${item.originalReleaseDate.day}`,
              )
            : null;
    }

    return null;
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
    if ('replayGain' in item) {
        return item.replayGain && (item.replayGain.albumPeak || item.replayGain.trackPeak)
            ? {
                  album: item.replayGain.albumPeak,
                  track: item.replayGain.trackPeak,
              }
            : null;
    }

    return null;
}

function getRecordLabels(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('recordLabels' in item) {
        return (item.recordLabels || []).map((recordLabel) => ({
            id: recordLabel.name,
            name: recordLabel.name,
        }));
    }

    return [];
}

function getReleaseDate(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('releaseDate' in item) {
        return item.releaseDate
            ? formatDate.toUTCDate(
                  `${item.releaseDate.year}-${item.releaseDate.month}-${item.releaseDate.day}`,
              )
            : null;
    }

    return null;
}

function getReleaseTypes(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('releaseTypes' in item) {
        return (item.releaseTypes || []).map((releaseType) => ({
            id: releaseType,
            name: releaseType,
        }));
    }

    return [];
}

function getSortName(
    item:
        | components['schemas']['AlbumID3']
        | components['schemas']['AlbumID3WithSongs']
        | components['schemas']['Child'],
) {
    if ('sortName' in item) {
        return item.sortName || '';
    }

    if ('name' in item) {
        return item.name || '';
    }

    if ('title' in item) {
        return item.title || '';
    }

    return '';
}

function getStreamUrl(id: string, server: ServerListItem) {
    return `${server.url}/rest/stream.view?id=${id}&v=1.16.1&c=Feishin&${server.credential}`;
}
