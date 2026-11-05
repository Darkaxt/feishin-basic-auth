import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import i18n from '/@/i18n/i18n';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { usePlaybackType } from '/@/renderer/store/settings.store';
import { logger } from '/@/renderer/utils/logger';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerType, WebAudio } from '/@/shared/types/types';
import {
    bindVisualizerSystemAudioRecovery,
    getVisualizerDisplayMediaOptions,
    VisualizerSystemAudioRecoveryReason,
} from '/@/shared/utils/visualizer-system-audio';

const electronUtils = isElectron() ? window.api.utils : null;

export function useVisualizerSystemAudio(options: {
    onSystemAudioCaptureDenied?: () => void;
    onSystemAudioCaptureLost?: () => void;
    onSystemAudioCaptureSuccess?: () => void;
    shouldAttemptConnection: boolean;
    shouldKeepConnection?: boolean;
}) {
    const {
        onSystemAudioCaptureDenied,
        onSystemAudioCaptureLost,
        onSystemAudioCaptureSuccess,
        shouldAttemptConnection,
        shouldKeepConnection = shouldAttemptConnection,
    } = options;
    const onDeniedRef = useRef(onSystemAudioCaptureDenied);
    const onLostRef = useRef(onSystemAudioCaptureLost);
    const onSuccessRef = useRef(onSystemAudioCaptureSuccess);
    onDeniedRef.current = onSystemAudioCaptureDenied;
    onLostRef.current = onSystemAudioCaptureLost;
    onSuccessRef.current = onSystemAudioCaptureSuccess;
    const playbackType = usePlaybackType();
    const { setWebAudio, webAudio } = useWebAudio();
    const webAudioRef = useRef(webAudio);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const connectInFlightRef = useRef(false);
    const recoveryPendingRef = useRef(false);
    const captureGeneration = useRef(0);
    const shouldAttemptConnectionRef = useRef(shouldAttemptConnection);
    const [connectionRevision, setConnectionRevision] = useState(0);
    const [isConnecting, setIsConnecting] = useState(false);

    shouldAttemptConnectionRef.current = shouldAttemptConnection;

    useEffect(() => {
        webAudioRef.current = webAudio;
    }, [webAudio]);

    const disconnect = useCallback(() => {
        recoveryPendingRef.current = false;
        captureGeneration.current += 1;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (sourceRef.current) {
            // Consumers own their input connections. Disconnecting them here makes
            // AudioMotion.destroy() throw before removing its canvas on recovery.
            // Stopping the stream releases capture; the visualizer detaches its graph.
            sourceRef.current = null;
        }
        const w = webAudioRef.current;
        if (!w || !setWebAudio) {
            return;
        }

        if (isVisualizerOnlyContext(w)) {
            void w.context.close().catch(() => {});
            setWebAudio(undefined);
            webAudioRef.current = undefined;
            return;
        }

        if (w.visualizerInputs?.length) {
            const next = { ...w, visualizerInputs: undefined };
            setWebAudio(next);
            webAudioRef.current = next;
        }
    }, [setWebAudio]);

    useEffect(() => {
        if (playbackType === PlayerType.WEB || !shouldKeepConnection) {
            disconnect();
        }
    }, [playbackType, shouldKeepConnection, disconnect]);

    useEffect(() => () => disconnect(), [disconnect]);

    const connect = useCallback(async () => {
        if (!isElectron()) {
            return;
        }

        if (!setWebAudio) return;
        if (connectInFlightRef.current) return;

        disconnect();
        const generation = captureGeneration.current;
        connectInFlightRef.current = true;
        setIsConnecting(true);

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia(
                getVisualizerDisplayMediaOptions(Boolean(electronUtils?.isMacOS())),
            );

            if (!shouldAttemptConnectionRef.current || generation !== captureGeneration.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            streamRef.current = stream;

            stream.getVideoTracks().forEach((track) => track.stop());

            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                stream.getTracks().forEach((t) => t.stop());
                toast.error({
                    message: i18n.t('visualizer.systemAudioNoAudioTrack', {
                        postProcess: 'sentenceCase',
                    }),
                });
                onDeniedRef.current?.();
                return;
            }

            let latest = webAudioRef.current;
            if (!latest?.context || latest.context.state === 'closed') {
                if (!('AudioContext' in window)) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                const context = new AudioContext({ latencyHint: 'playback' });
                latest = { context, dsp: null, gains: [] };
                setWebAudio(latest);
                webAudioRef.current = latest;
            }

            try {
                await latest.context.resume();
            } catch {
                // ignore
            }

            if (!shouldAttemptConnectionRef.current || generation !== captureGeneration.current) {
                return;
            }

            const source = latest.context.createMediaStreamSource(stream);
            streamRef.current = stream;
            sourceRef.current = source;

            const next = { ...latest, visualizerInputs: [source] };
            setWebAudio(next);
            webAudioRef.current = next;
            setConnectionRevision((revision) => revision + 1);
            logger.info('Visualizer system audio connected', {
                trackLabel: audioTracks[0]?.label,
                trackReadyState: audioTracks[0]?.readyState,
            });
            onSuccessRef.current?.();
        } catch (e) {
            if (generation !== captureGeneration.current) return;
            disconnect();
            const name = (e as DOMException)?.name;
            logger.warn('Visualizer system audio capture failed', {
                message: (e as Error)?.message,
                name,
            });
            if (name === 'NotAllowedError' || name === 'AbortError') {
                onDeniedRef.current?.();
                return;
            }
            toast.error({
                message: i18n.t('visualizer.systemAudioCaptureFailed', {
                    message: (e as Error).message,
                }),
            });
        } finally {
            connectInFlightRef.current = false;
            setIsConnecting(false);
            if (recoveryPendingRef.current && shouldAttemptConnectionRef.current) {
                recoveryPendingRef.current = false;
                void connectRef.current();
            }
        }
    }, [disconnect, setWebAudio]);

    const connectRef = useRef(connect);
    connectRef.current = connect;

    useEffect(() => {
        if (!isElectron() || playbackType !== PlayerType.LOCAL) {
            return;
        }

        const observedStream = streamRef.current;
        const audioTrack = observedStream?.getAudioTracks()[0];

        const onRecoveryNeeded = (reason: VisualizerSystemAudioRecoveryReason) => {
            if (reason === 'track-ended' && streamRef.current !== observedStream) {
                return;
            }

            if (!shouldAttemptConnectionRef.current) return;
            if (!sourceRef.current && !connectInFlightRef.current) return;

            logger.warn('Visualizer system audio capture needs recovery', { reason });
            disconnect();
            onLostRef.current?.();
            setConnectionRevision((revision) => revision + 1);

            if (connectInFlightRef.current) {
                recoveryPendingRef.current = true;
            } else {
                void connectRef.current();
            }
        };
        const unbindSystemAudio = bindVisualizerSystemAudioRecovery({
            audioTrack,
            mediaDevices: navigator.mediaDevices,
            onRecoveryNeeded,
        });
        const unbindMpv = window.api.visualizer.onAudioReconfigured(() =>
            onRecoveryNeeded('mpv-audio-reconfig'),
        );
        return () => {
            unbindSystemAudio();
            unbindMpv();
        };
    }, [connectionRevision, disconnect, playbackType]);

    return {
        connect: async () => {
            if (connectInFlightRef.current) {
                return;
            }
            await connectRef.current();
        },
        isConnected: Boolean(webAudio?.visualizerInputs?.length),
        isConnecting,
    };
}

function isVisualizerOnlyContext(webAudio: WebAudio) {
    return webAudio.gains.length === 0 && webAudio.dsp === null;
}
