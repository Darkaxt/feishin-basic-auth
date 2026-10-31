import isElectron from 'is-electron';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsLocalVisualizerSurfaceVisible } from '/@/renderer/features/player/hooks/use-is-local-visualizer-surface-visible';
import { useVisualizerSystemAudio } from '/@/renderer/features/player/hooks/use-visualizer-system-audio';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { useMpvSettings, usePlaybackType } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerType } from '/@/shared/types/types';
import { shouldConnectVisualizerSystemAudio } from '/@/shared/utils/visualizer-system-audio';

export function VisualizerSystemAudioBridgeHook() {
    const playbackType = usePlaybackType();
    const isVisible = useIsLocalVisualizerSurfaceVisible();
    const surface = useMemo(
        () => ({ visible: playbackType === PlayerType.LOCAL && isVisible }),
        [playbackType, isVisible],
    );
    const [readySurface, setReadySurface] = useState<null | typeof surface>(null);

    useEffect(() => {
        if (!isElectron()) return;
        let cancelled = false;
        window.api.visualizer
            .setLocalSurfaceVisible(surface.visible)
            .then((acknowledged) => {
                if (!cancelled && acknowledged) setReadySurface(surface);
            })
            .catch((error) => logger.warn('Visualizer eligibility update failed', { error }));
        return () => {
            cancelled = true;
            // The renderer may already be closing when this cleanup runs.
            void window.api.visualizer.setLocalSurfaceVisible(false).catch(() => {});
        };
    }, [surface]);

    if (!isElectron() || playbackType !== PlayerType.LOCAL) return null;
    return (
        <VisualizerSystemAudioBridge surfaceReady={surface.visible && readySurface === surface} />
    );
}

function VisualizerSystemAudioBridge({ surfaceReady }: { surfaceReady: boolean }) {
    const { t } = useTranslation();
    const { audioExclusiveMode } = useMpvSettings();
    const { webAudio } = useWebAudio();
    const visible = useIsLocalVisualizerSurfaceVisible();
    const attempted = useRef(false);
    const wasBlocked = useRef(false);
    const exclusive = audioExclusiveMode === 'yes';
    const canCaptureSystemAudio = surfaceReady && visible && !exclusive;
    const { connect, isConnected, isConnecting } = useVisualizerSystemAudio({
        shouldAttemptConnection: canCaptureSystemAudio,
        shouldKeepConnection: canCaptureSystemAudio,
    });
    const hasVisualizerInput = isConnected || Boolean(webAudio?.visualizerInputs?.length);

    useEffect(() => {
        if (!visible) attempted.current = false;
        if (
            shouldConnectVisualizerSystemAudio({
                canCaptureSystemAudio,
                hasAttemptedConnectionThisSession: attempted.current,
                hasVisualizerInput,
                isConnecting,
            })
        ) {
            attempted.current = true;
            void connect();
        }
    }, [canCaptureSystemAudio, connect, hasVisualizerInput, isConnecting, visible]);

    useEffect(() => {
        const blocked = visible && exclusive;
        if (blocked && !wasBlocked.current)
            toast.error({ message: t('visualizer.systemAudioExclusiveModeNotSupported') });
        wasBlocked.current = blocked;
    }, [exclusive, t, visible]);
    return null;
}
