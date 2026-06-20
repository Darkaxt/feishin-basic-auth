import { SyntheticEvent, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lidaclips-panel.module.css';

import { useLidaClipsCurrentSongLookup } from '/@/renderer/features/lidaclips/hooks/use-lidaclips-current-song-lookup';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerDuration,
    usePlayerStoreBase,
    usePlayerTimestamp,
    useSettingsStore,
} from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { Center } from '/@/shared/components/center/center';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import {
    getLidaClipsFallbackTab,
    getLidaClipsPlaybackDecision,
    LIDA_CLIPS_DISPLAY_MODE,
    mapLidaClipsProgress,
    shouldStopLidaClipsModeAfterAutoNext,
} from '/@/shared/utils/lidaclips';

export const LidaClipsPlaybackCoordinator = () => {
    const { clipModeActive } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { webAudio } = usePlaybackSettings();
    const { mediaPause, mediaPlay } = usePlayer();
    const { currentSong, data, isLoading, lookupQuery, settings } =
        useLidaClipsCurrentSongLookup(clipModeActive);

    useEffect(() => {
        if (clipModeActive && !settings.enabled) {
            setStore({ clipModeActive: false });
        }
    }, [clipModeActive, setStore, settings.enabled]);

    useEffect(() => {
        if (!clipModeActive) {
            return;
        }

        mediaPause();
    }, [clipModeActive, currentSong?._uniqueId, mediaPause]);

    useEffect(() => {
        if (!clipModeActive || !settings.enabled || lookupQuery) {
            return;
        }

        setStore({
            activeTab: getLidaClipsFallbackTab({ webAudio }),
            clipModeActive: true,
        });
        mediaPlay();
    }, [clipModeActive, lookupQuery, mediaPlay, setStore, settings.enabled, webAudio]);

    useEffect(() => {
        if (!clipModeActive || !settings.enabled || isLoading || !data) {
            return;
        }

        const decision = getLidaClipsPlaybackDecision({
            clipModeActive,
            lookupStatus: data.status,
            webAudio,
        });

        setStore({
            activeTab: decision.tab,
            clipModeActive: decision.clipModeActive,
        });

        if (decision.playerAction === 'pauseAudio') {
            mediaPause();
        } else if (decision.playerAction === 'playAudio') {
            mediaPlay();
        }
    }, [
        clipModeActive,
        data,
        isLoading,
        mediaPause,
        mediaPlay,
        setStore,
        settings.enabled,
        webAudio,
    ]);

    return null;
};

export const LidaClipsPanel = () => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const { activeTab, clipModeActive, clipModeTransferRatio, clipModeTransferSongUniqueId } =
        useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { mediaPause } = usePlayer();
    const { mediaAutoNext } = usePlayerActions();
    const playerTimestamp = usePlayerTimestamp();
    const songDuration = usePlayerDuration();
    const { clipStreamUrl, currentSong, data, isLoading, lookupQuery, settings } =
        useLidaClipsCurrentSongLookup(true);

    const handleVideoPlay = useCallback(() => {
        setStore({ activeTab: 'clips', clipModeActive: true });
        mediaPause();
    }, [mediaPause, setStore]);

    const handleVideoEnded = useCallback(() => {
        const playerState = usePlayerStoreBase.getState();
        const playerDataBeforeNext = playerState.getPlayerData();
        const shouldStopClipMode = shouldStopLidaClipsModeAfterAutoNext({
            hasNextSong: Boolean(playerDataBeforeNext.nextSong),
            pauseOnNext: playerState.player.pauseOnNextSongEnd,
        });
        mediaAutoNext({ keepPaused: true });

        if (shouldStopClipMode) {
            setStore({ clipModeActive: false });
        }
    }, [mediaAutoNext, setStore]);

    const handleVideoLoadedMetadata = useCallback(
        (event: SyntheticEvent<HTMLVideoElement>) => {
            if (
                !Number.isFinite(event.currentTarget.duration) ||
                event.currentTarget.duration <= 0
            ) {
                return;
            }

            if (
                clipModeTransferRatio !== null &&
                clipModeTransferRatio !== undefined &&
                clipModeTransferSongUniqueId === currentSong?._uniqueId
            ) {
                event.currentTarget.currentTime = mapLidaClipsProgress({
                    sourceCurrentTime: clipModeTransferRatio,
                    sourceDuration: 1,
                    targetDuration: event.currentTarget.duration,
                });
                setStore({
                    clipModeTransferRatio: null,
                    clipModeTransferSongUniqueId: null,
                });
                return;
            }

            if (
                settings.displayMode === LIDA_CLIPS_DISPLAY_MODE.AMBIENT_BACKGROUND &&
                songDuration &&
                songDuration > 0
            ) {
                event.currentTarget.currentTime = mapLidaClipsProgress({
                    sourceCurrentTime: playerTimestamp,
                    sourceDuration: songDuration,
                    targetDuration: event.currentTarget.duration,
                });
            }
        },
        [
            clipModeTransferRatio,
            clipModeTransferSongUniqueId,
            currentSong?._uniqueId,
            playerTimestamp,
            setStore,
            settings.displayMode,
            songDuration,
        ],
    );

    const captureClipTransfer = useCallback(
        (video: HTMLVideoElement) => {
            const latestDisplayMode = useSettingsStore.getState().lidaClips.displayMode;

            if (latestDisplayMode !== LIDA_CLIPS_DISPLAY_MODE.AMBIENT_BACKGROUND) {
                return;
            }

            if (!Number.isFinite(video.duration) || video.duration <= 0) {
                return;
            }

            setStore({
                clipModeActive: false,
                clipModeTransferRatio: Math.max(0, Math.min(1, video.currentTime / video.duration)),
                clipModeTransferSongUniqueId: currentSong?._uniqueId ?? null,
            });
        },
        [currentSong?._uniqueId, setStore],
    );

    useEffect(() => {
        const video = videoRef.current;

        if (!video || !clipModeActive || activeTab !== 'clips' || !clipStreamUrl) {
            return;
        }

        void video.play().catch(() => {});
    }, [activeTab, clipModeActive, clipStreamUrl]);

    useEffect(() => {
        const video = videoRef.current;

        return () => {
            if (!video) return;
            captureClipTransfer(video);
            video.pause();
            video.removeAttribute('src');
            video.load();
        };
    }, [captureClipTransfer, clipStreamUrl, currentSong?.id]);

    if (!settings.enabled) {
        return null;
    }

    if (!lookupQuery) {
        return (
            <Center className={styles.message}>
                <Text fw={500} isMuted isNoSelect>
                    {t('page.fullscreenPlayer.noClips', { postProcess: 'sentenceCase' })}
                </Text>
            </Center>
        );
    }

    if (isLoading) {
        return <Spinner container />;
    }

    if (!data || data.status === 'disabled' || data.status === 'no-match') {
        return (
            <Center className={styles.message}>
                <Text fw={500} isMuted isNoSelect>
                    {t('page.fullscreenPlayer.noClips', { postProcess: 'sentenceCase' })}
                </Text>
            </Center>
        );
    }

    if (data.status === 'not-configured') {
        return (
            <Center className={styles.message}>
                <Text fw={500} isMuted isNoSelect>
                    {t('page.fullscreenPlayer.clipsNotConfigured', {
                        postProcess: 'sentenceCase',
                    })}
                </Text>
            </Center>
        );
    }

    if (data.status !== 'ok') {
        return (
            <Center className={styles.message}>
                <Text fw={500} isMuted isNoSelect>
                    {t('page.fullscreenPlayer.clipsError', { postProcess: 'sentenceCase' })}
                </Text>
            </Center>
        );
    }

    return (
        <div className={styles.clipsContainer}>
            <div className={styles.videoShell}>
                <video
                    className={styles.video}
                    controls
                    onEnded={handleVideoEnded}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onPlay={handleVideoPlay}
                    preload="metadata"
                    ref={videoRef}
                    src={data.clip.localStreamUrl}
                />
            </div>
        </div>
    );
};
