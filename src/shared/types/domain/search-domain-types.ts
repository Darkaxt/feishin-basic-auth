import { Album } from '/@/shared/types/domain/album-domain-types';
import { Artist } from '/@/shared/types/domain/artist-domain-types';
import { Song } from '/@/shared/types/domain/song-domain-types';

export type SearchAlbumArtistsQuery = {
    albumArtistLimit?: number;
    albumArtistStartIndex?: number;
    musicFolderId?: string;
    query?: string;
};

export type SearchAlbumsQuery = {
    albumLimit?: number;
    albumStartIndex?: number;
    musicFolderId?: string;
    query?: string;
};

export type SearchQuery = {
    albumArtistLimit?: number;
    albumArtistStartIndex?: number;
    albumLimit?: number;
    albumStartIndex?: number;
    musicFolderId?: string;
    query?: string;
    songLimit?: number;
    songStartIndex?: number;
};

export type SearchRequest = { query: SearchQuery };

export type SearchResponse = {
    albumArtists: Artist[];
    albums: Album[];
    songs: Song[];
};

export type SearchSongsQuery = {
    musicFolderId?: string;
    query?: string;
    songLimit?: number;
    songStartIndex?: number;
};
