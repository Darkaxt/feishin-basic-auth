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
