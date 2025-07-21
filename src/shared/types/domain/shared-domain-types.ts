import { JFSortOrder } from '/@/shared/api/jellyfin.types';
import { NDSortOrder } from '/@/shared/api/navidrome.types';
import { Album } from '/@/shared/types/domain/album-domain-types';
import { Artist, RelatedArtist } from '/@/shared/types/domain/artist-domain-types';
import { QueueSong } from '/@/shared/types/domain/player-domain-types';
import { Playlist } from '/@/shared/types/domain/playlist-domain-types';
import { Song } from '/@/shared/types/domain/song-domain-types';

export enum LibraryItem {
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    GENRE = 'genre',
    PLAYLIST = 'playlist',
    SONG = 'song',
    USER = 'user',
}

export enum ListSortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export type AnyLibraryItem = Album | Artist | Artist | Playlist | QueueSong | Song;

export type AnyLibraryItems = Album[] | Artist[] | Artist[] | Playlist[] | QueueSong[] | Song[];
type SortOrderMap = {
    jellyfin: Record<ListSortOrder, JFSortOrder>;
    navidrome: Record<ListSortOrder, NDSortOrder>;
    subsonic: Record<ListSortOrder, undefined>;
};

export const sortOrderMap: SortOrderMap = {
    jellyfin: {
        ASC: JFSortOrder.ASC,
        DESC: JFSortOrder.DESC,
    },
    navidrome: {
        ASC: NDSortOrder.ASC,
        DESC: NDSortOrder.DESC,
    },
    subsonic: {
        ASC: undefined,
        DESC: undefined,
    },
}; // This type from https://wicg.github.io/local-font-access/#fontdata
// NOTE: it is still experimental, so this should be updates as appropriate

export type FontData = {
    family: string;
    fullName: string;
    postscriptName: string;
    style: string;
};

export type Mood = {
    id: string;
    name: string;
};

export type Participants = Record<string, RelatedArtist[]>;

export type RecordLabel = {
    id: string;
    name: string;
};

export type ReleaseType = {
    id: string;
    name: string;
};

export type Tags = Record<string, string[]>;
