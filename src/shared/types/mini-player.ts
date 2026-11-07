export interface MiniPlayerCommand {
    action: 'dismiss' | 'enter' | 'queue' | 'restore';
    queueOpen?: boolean;
}

export interface MiniPlayerState {
    active: boolean;
    queueOpen: boolean;
    viewportWidth?: number;
}
