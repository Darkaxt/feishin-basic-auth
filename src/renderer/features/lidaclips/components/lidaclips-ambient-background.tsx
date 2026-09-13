import clsx from 'clsx';
import { SyntheticEvent, useCallback, useEffect, useMemo, useRef } from 'react';

import { useLidaClipsCurrentSongLookup } from '/@/renderer/features/lidaclips/hooks/use-lidaclips-current-song-lookup';
import styles from '/@/renderer/features/player/components/full-screen-player.module.css';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useLidaClipsSettings,
    usePlayerActions,
    usePlayerDuration,
    usePlayerStatus,
    usePlayerStoreBase,
    useSettingsStore,
} from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';
import {
    getLidaClipsAmbientPlaybackRate,
    LIDA_CLIPS_DISPLAY_MODE,
    mapLidaClipsProgress,
    shouldStopLidaClipsModeAfterAutoNext,
    shouldUseLidaClipsAmbientBackground,
} from '/@/shared/utils/lidaclips';

interface LidaClipsAmbientBackgroundProps {
    dynamicBackground: boolean | undefined;
}

export const LidaClipsAmbientBackground = ({
    dynamicBackground,
}: LidaClipsAmbientBackgroundProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const previousForegroundActiveRef = useRef(false);
    const skipSongResumeRef = useRef(false);
    const status = usePlayerStatus();
    const songDuration = usePlayerDuration();
    const settings = useLidaClipsSettings();
    const { mediaPause, mediaPlay, mediaSeekToTimestamp } = usePlayer();
    const { mediaAutoNext } = usePlayerActions();
    const { activeTab, clipModeActive, clipModeTransferRatio, clipModeTransferSongUniqueId } =
        useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { clipStreamUrl, currentSong, data, isLoading, lookupQuery } =
        useLidaClipsCurrentSongLookup(
            Boolean(
                settings.enabled &&
                settings.displayMode === LIDA_CLIPS_DISPLAY_MODE.AMBIENT_BACKGROUND &&
                dynamicBackground,
            ),
        );

    const foregroundActive = clipModeActive && activeTab === 'clips';

    const hasTransfer =
        clipModeTransferRatio !== null &&
        clipModeTransferRatio !== undefined &&
        clipModeTransferSongUniqueId === currentSong?._uniqueId;

    const clearTransfer = useCallback(() => {
        setStore({
            clipModeTransferRatio: null,
            clipModeTransferSongUniqueId: null,
        });
    }, [setStore]);

    const captureAmbientTransfer = useCallback(
        (video: HTMLVideoElement) => {
            const latestDisplayMode = useSettingsStore.getState().lidaClips.displayMode;

            if (latestDisplayMode !== LIDA_CLIPS_DISPLAY_MODE.PLAYER) {
                return;
            }

            if (!Number.isFinite(video.duration) || video.duration <= 0) {
                return;
            }

            setStore({
                clipModeTransferRatio: Math.max(0, Math.min(1, video.currentTime / video.duration)),
                clipModeTransferSongUniqueId: currentSong?._uniqueId ?? null,
            });
        },
        [currentSong?._uniqueId, setStore],
    );

    const resumeSongFromTransfer = useCallback(() => {
        if (!hasTransfer || clipModeTransferRatio === null || clipModeTransferRatio === undefined) {
            return;
        }

        if (songDuration && songDuration > 0) {
            mediaSeekToTimestamp(
                mapLidaClipsProgress({
                    sourceCurrentTime: clipModeTransferRatio,
                    sourceDuration: 1,
                    targetDuration: songDuration,
                }),
            );
        }

        clearTransfer();
        mediaPlay();
    }, [
        clearTransfer,
        clipModeTransferRatio,
        hasTransfer,
        mediaPlay,
        mediaSeekToTimestamp,
        songDuration,
    ]);

    const playbackRate = useMemo(() => {
        return getLidaClipsAmbientPlaybackRate({
            clipDuration: data?.status === 'ok' ? data.clip.duration : undefined,
            mode: settings.ambientSyncMode,
            songDuration,
        });
    }, [data, settings.ambientSyncMode, songDuration]);

    const shouldRender = shouldUseLidaClipsAmbientBackground({
        dynamicBackground: Boolean(dynamicBackground),
        enabled: settings.enabled,
        mode: settings.displayMode,
        status: data?.status,
    });

    const handleVideoEnded = useCallback(() => {
        if (!foregroundActive) {
            return;
        }

        const playerState = usePlayerStoreBase.getState();
        const playerDataBeforeNext = playerState.getPlayerData();
        const shouldStopClipMode = shouldStopLidaClipsModeAfterAutoNext({
            hasNextSong: Boolean(playerDataBeforeNext.nextSong),
            pauseOnNext: playerState.player.pauseOnNextSongEnd,
        });

        mediaAutoNext({ keepPaused: true });

        if (shouldStopClipMode) {
            skipSongResumeRef.current = true;
            setStore({ clipModeActive: false });
        }
    }, [foregroundActive, mediaAutoNext, setStore]);

    useEffect(() => {
        if (!hasTransfer || isLoading || !lookupQuery || !data || data.status === 'ok') {
            return;
        }

        resumeSongFromTransfer();
    }, [data, hasTransfer, isLoading, lookupQuery, resumeSongFromTransfer]);

    useEffect(() => {
        const video = videoRef.current;

        if (
            !video ||
            !shouldRender ||
            !hasTransfer ||
            clipModeTransferRatio === null ||
            clipModeTransferRatio === undefined ||
            !Number.isFinite(video.duration) ||
            video.duration <= 0
        ) {
            return;
        }

        video.currentTime = mapLidaClipsProgress({
            sourceCurrentTime: clipModeTransferRatio,
            sourceDuration: 1,
            targetDuration: video.duration,
        });
        resumeSongFromTransfer();
    }, [clipModeTransferRatio, hasTransfer, resumeSongFromTransfer, shouldRender]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video || !shouldRender || !clipStreamUrl) {
            return;
        }

        video.playbackRate = foregroundActive ? 1 : playbackRate;

        if (foregroundActive || status === PlayerStatus.PLAYING) {
            void video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, [clipStreamUrl, foregroundActive, playbackRate, shouldRender, status]);

    useEffect(() => {
        const wasForegroundActive = previousForegroundActiveRef.current;
        previousForegroundActiveRef.current = foregroundActive;

        if (!wasForegroundActive || foregroundActive) {
            return;
        }

        if (skipSongResumeRef.current) {
            skipSongResumeRef.current = false;
            return;
        }

        const video = videoRef.current;

        if (
            video &&
            Number.isFinite(video.duration) &&
            video.duration > 0 &&
            songDuration &&
            songDuration > 0
        ) {
            mediaSeekToTimestamp(
                mapLidaClipsProgress({
                    sourceCurrentTime: video.currentTime,
                    sourceDuration: video.duration,
                    targetDuration: songDuration,
                }),
            );
        }

        mediaPlay();
    }, [foregroundActive, mediaPlay, mediaSeekToTimestamp, songDuration]);

    useEffect(() => {
        if (foregroundActive) {
            mediaPause();
        }
    }, [foregroundActive, mediaPause]);

    useEffect(() => {
        const video = videoRef.current;

        return () => {
            if (!video) return;
            captureAmbientTransfer(video);
            video.pause();
            video.removeAttribute('src');
            video.load();
        };
    }, [captureAmbientTransfer, clipStreamUrl]);

    const handleLoadedMetadata = useCallback(
        (event: SyntheticEvent<HTMLVideoElement>) => {
            const video = event.currentTarget;
            const rate = getLidaClipsAmbientPlaybackRate({
                clipDuration: video.duration,
                mode: settings.ambientSyncMode,
                songDuration,
            });

            video.playbackRate = rate;

            if (
                hasTransfer &&
                clipModeTransferRatio !== null &&
                clipModeTransferRatio !== undefined &&
                Number.isFinite(video.duration) &&
                video.duration > 0
            ) {
                video.currentTime = mapLidaClipsProgress({
                    sourceCurrentTime: clipModeTransferRatio,
                    sourceDuration: 1,
                    targetDuration: video.duration,
                });
                resumeSongFromTransfer();
                void video.play().catch(() => {});
                return;
            }

            if (foregroundActive || status === PlayerStatus.PLAYING) {
                void video.play().catch(() => {});
            }
        },
        [
            clipModeTransferRatio,
            foregroundActive,
            hasTransfer,
            resumeSongFromTransfer,
            settings.ambientSyncMode,
            songDuration,
            status,
        ],
    );

    if (!shouldRender || !clipStreamUrl) {
        return null;
    }

    return (
        <video
            aria-hidden={!foregroundActive}
            className={clsx(styles.backgroundVideo, {
                [styles.backgroundVideoForeground]: foregroundActive,
            })}
            controls={foregroundActive}
            key={`${currentSong?._uniqueId ?? 'none'}-${clipStreamUrl}`}
            muted={!foregroundActive}
            onEnded={handleVideoEnded}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
            preload="metadata"
            ref={videoRef}
            src={clipStreamUrl}
        />
    );
};
