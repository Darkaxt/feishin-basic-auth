import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import i18n from '/@/i18n/i18n';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { usePlaybackType } from '/@/renderer/store/settings.store';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerType, WebAudio } from '/@/shared/types/types';

export function useVisualizerSystemAudio(options: {
    onSystemAudioCaptureDenied?: () => void;
    onSystemAudioCaptureSuccess?: () => void;
    shouldAttemptConnection: boolean;
    shouldKeepConnection?: boolean;
}) {
    const {
        onSystemAudioCaptureDenied,
        onSystemAudioCaptureSuccess,
        shouldAttemptConnection,
        shouldKeepConnection = shouldAttemptConnection,
    } = options;
    const onDeniedRef = useRef(onSystemAudioCaptureDenied);
    const onSuccessRef = useRef(onSystemAudioCaptureSuccess);
    onDeniedRef.current = onSystemAudioCaptureDenied;
    onSuccessRef.current = onSystemAudioCaptureSuccess;
    const playbackType = usePlaybackType();
    const { setWebAudio, webAudio } = useWebAudio();
    const webAudioRef = useRef(webAudio);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const connectInFlightRef = useRef(false);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        webAudioRef.current = webAudio;
    }, [webAudio]);

    const disconnect = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (sourceRef.current) {
            try {
                sourceRef.current.disconnect();
            } catch {
                // ignore
            }
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

    const connect = useCallback(async () => {
        if (!isElectron()) {
            return;
        }

        if (!setWebAudio) return;
        if (connectInFlightRef.current) return;

        disconnect();
        connectInFlightRef.current = true;
        setIsConnecting(true);

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                audio: true,
                monitorTypeSurfaces: 'include',
                systemAudio: 'include',
                video: true,
                windowAudio: 'system',
            } as DisplayMediaStreamOptions);

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

            const source = latest.context.createMediaStreamSource(stream);
            streamRef.current = stream;
            sourceRef.current = source;

            const next = { ...latest, visualizerInputs: [source] };
            setWebAudio(next);
            webAudioRef.current = next;
            onSuccessRef.current?.();
        } catch (e) {
            const name = (e as DOMException)?.name;
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
        }
    }, [disconnect, setWebAudio]);

    const connectRef = useRef(connect);
    connectRef.current = connect;

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
