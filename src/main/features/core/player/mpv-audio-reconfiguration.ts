import type { EventEmitter } from 'node:events';

export const bindMpvAudioReconfiguration = (
    socket: EventEmitter,
    isCurrent: () => boolean,
    onReconfigured: () => void,
): (() => void) => {
    const onMessage = (message: { event?: string }) => {
        if (message.event === 'audio-reconfig' && isCurrent()) onReconfigured();
    };
    socket.on('message', onMessage);
    return () => socket.removeListener('message', onMessage);
};
