export interface SystemAudioConnectionConditions {
    canCaptureSystemAudio: boolean;
    hasAttemptedConnectionThisSession?: boolean;
    hasVisualizerInput: boolean;
    isConnecting: boolean;
}

export type VisualizerSystemAudioRecoveryReason =
    | 'devicechange'
    | 'mpv-audio-reconfig'
    | 'track-ended';

export function bindVisualizerSystemAudioRecovery({
    audioTrack,
    mediaDevices,
    onRecoveryNeeded,
}: {
    audioTrack?: EventTarget | null;
    mediaDevices: EventTarget;
    onRecoveryNeeded: (reason: VisualizerSystemAudioRecoveryReason) => void;
}): () => void {
    const handleDeviceChange = () => onRecoveryNeeded('devicechange');
    const handleTrackEnded = () => onRecoveryNeeded('track-ended');

    mediaDevices.addEventListener('devicechange', handleDeviceChange);
    audioTrack?.addEventListener('ended', handleTrackEnded);

    return () => {
        mediaDevices.removeEventListener('devicechange', handleDeviceChange);
        audioTrack?.removeEventListener('ended', handleTrackEnded);
    };
}

export function getVisualizerDisplayMediaOptions(isMacOS: boolean): DisplayMediaStreamOptions {
    return {
        audio: {
            autoGainControl: false,
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
        },
        monitorTypeSurfaces: 'include',
        systemAudio: 'include',
        video: isMacOS,
        windowAudio: 'system',
    } as DisplayMediaStreamOptions;
}

export function shouldConnectVisualizerSystemAudio({
    canCaptureSystemAudio,
    hasAttemptedConnectionThisSession = false,
    hasVisualizerInput,
    isConnecting,
}: SystemAudioConnectionConditions): boolean {
    return (
        canCaptureSystemAudio &&
        !hasAttemptedConnectionThisSession &&
        !hasVisualizerInput &&
        !isConnecting
    );
}
