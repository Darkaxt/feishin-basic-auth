import { Song } from '/@/shared/types/domain/song-domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export enum Played {
    All = 'all',
    Never = 'never',
    Played = 'played',
}

export interface PlayerData {
    current: {
        index: number;
        nextIndex?: number;
        player: 1 | 2;
        previousIndex?: number;
        shuffledIndex: number;
        song?: QueueSong;
        status: PlayerStatus;
    };
    player1?: QueueSong;
    player2?: QueueSong;
    queue: QueueData;
}

export interface QueueData {
    current?: QueueSong;
    length: number;
    next?: QueueSong;
    previous?: QueueSong;
}

export type QueueSong = Song & {
    _uniqueId: string;
};

export type TranscodingQuery = {
    base: string;
    bitrate?: number;
    format?: string;
};

export type TranscodingRequest = {
    query: TranscodingQuery;
};
