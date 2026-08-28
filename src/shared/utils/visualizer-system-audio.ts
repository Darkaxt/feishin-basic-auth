export interface SystemAudioPromptConditions {
    canCaptureSystemAudio: boolean;
    hasAttemptedConnectionThisSession?: boolean;
    hasVisualizerInput: boolean;
    isConnecting: boolean;
    promptState: SystemAudioPromptState;
}

export type SystemAudioPromptState =
    | 'loading'
    | {
          consent: boolean;
          promptedThisSession: boolean;
      };

export type VisualizerSystemAudioRecoveryReason = 'devicechange' | 'track-ended';

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
        audio: true,
        monitorTypeSurfaces: 'include',
        systemAudio: 'include',
        video: isMacOS,
        windowAudio: 'system',
    } as DisplayMediaStreamOptions;
}

export function shouldAutoConnectSystemAudio({
    canCaptureSystemAudio,
    hasAttemptedConnectionThisSession = false,
    hasVisualizerInput,
    isConnecting,
    promptState,
}: SystemAudioPromptConditions): boolean {
    return (
        canCaptureSystemAudio &&
        promptState !== 'loading' &&
        promptState.consent &&
        !hasAttemptedConnectionThisSession &&
        !hasVisualizerInput &&
        !isConnecting
    );
}

export function shouldOpenSystemAudioConsentPrompt({
    canCaptureSystemAudio,
    hasVisualizerInput,
    isConnecting,
    promptState,
}: SystemAudioPromptConditions): boolean {
    return (
        canCaptureSystemAudio &&
        promptState !== 'loading' &&
        !promptState.consent &&
        !promptState.promptedThisSession &&
        !hasVisualizerInput &&
        !isConnecting
    );
}
