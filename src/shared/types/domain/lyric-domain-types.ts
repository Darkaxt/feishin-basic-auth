import { BaseEndpointArgs } from './api-domain-types';
import { Song } from '/@/shared/types/domain/song-domain-types';

export enum LyricSource {
    GENIUS = 'Genius',
    LRCLIB = 'lrclib.net',
    NETEASE = 'NetEase',
}

export type FullLyricsMetadata = Omit<InternetProviderLyricResponse, 'id' | 'lyrics' | 'source'> & {
    lyrics: LyricsResponse;
    remote: boolean;
    source: string;
};
export type InternetProviderLyricResponse = {
    artist: string;
    id: string;
    lyrics: string;
    name: string;
    source: LyricSource;
};
export type InternetProviderLyricSearchResponse = {
    artist: string;
    id: string;
    name: string;
    score?: number;
    source: LyricSource;
};

export type LyricGetQuery = {
    remoteSongId: string;
    remoteSource: LyricSource;
    song: Song;
};

export type LyricOverride = Omit<InternetProviderLyricResponse, 'lyrics'>;

export type LyricsArgs = BaseEndpointArgs & {
    query: LyricsQuery;
};
export type LyricSearchQuery = {
    album?: string;
    artist?: string;
    duration?: number;
    name?: string;
};
export type LyricsOverride = Omit<FullLyricsMetadata, 'lyrics'> & { id: string };

export type LyricsQuery = {
    songId: string;
};

export type LyricsResponse = string | SynchronizedLyricsArray;

export type StructuredLyric = (StructuredSyncedLyric | StructuredUnsyncedLyric) & {
    lang: string;
};

export type StructuredLyricsArgs = BaseEndpointArgs & {
    query: LyricsQuery;
};

export type StructuredSyncedLyric = Omit<FullLyricsMetadata, 'lyrics'> & {
    lyrics: SynchronizedLyricsArray;
    synced: true;
};
export type StructuredUnsyncedLyric = Omit<FullLyricsMetadata, 'lyrics'> & {
    lyrics: string;
    synced: false;
};
export type SynchronizedLyricsArray = Array<[number, string]>;
