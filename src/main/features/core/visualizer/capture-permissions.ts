export interface VisualizerCapturePermissionInput {
    eligible: boolean;
    isMainFrame?: boolean;
    mainFrameUrl: string;
    mediaType?: string;
    mediaTypes?: readonly string[];
    permission: string;
    requestingUrl?: string;
}

export const isVisualizerCapturePermissionAllowed = (input: VisualizerCapturePermissionInput) => {
    if (!input.eligible || input.isMainFrame !== true || !input.requestingUrl) return false;
    try {
        const requesting = new URL(input.requestingUrl);
        const main = new URL(input.mainFrameUrl);
        requesting.hash = '';
        main.hash = '';
        if (requesting.href !== main.href) return false;
    } catch {
        return false;
    }
    if (input.permission === 'display-capture') return true;
    // Electron 43 reports desktop loopback as media with empty request types and no
    // camera/microphone check type. Keep those device permissions denied.
    return (
        input.permission === 'media' &&
        input.mediaType === undefined &&
        (input.mediaTypes === undefined || input.mediaTypes.length === 0)
    );
};
