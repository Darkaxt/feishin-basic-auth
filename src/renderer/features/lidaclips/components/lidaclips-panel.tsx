import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lidaclips-panel.module.css';

import {
    getLidaClipsQueryFromSong,
    lidaClipsQueries,
} from '/@/renderer/features/lidaclips/api/lidaclips-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    useAuthStore,
    useLidaClipsSettings,
    usePlaybackSettings,
    usePlayerActions,
    usePlayerSong,
    usePlayerStoreBase,
} from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { Center } from '/@/shared/components/center/center';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import {
    createLidaClipsProxyAuthSourceFromServer,
    getLidaClipsFallbackTab,
    getLidaClipsPlaybackDecision,
    shouldStopLidaClipsModeAfterAutoNext,
} from '/@/shared/utils/lidaclips';

const useLidaClipsCurrentSongLookup = (enabled: boolean) => {
    const currentSong = usePlayerSong();
    const settings = useLidaClipsSettings();
    const songServer = useAuthStore((state) =>
        currentSong?._serverId ? state.serverList[currentSong._serverId] : null,
    );

    const lookupQuery = useMemo(() => getLidaClipsQueryFromSong(currentSong), [currentSong]);
    const proxyAuth = useMemo(
        () => createLidaClipsProxyAuthSourceFromServer(songServer),
        [songServer],
    );

    const { data, isLoading } = useQuery(
        lidaClipsQueries.clip({
            options: {
                enabled: Boolean(enabled && settings.enabled && lookupQuery),
            },
            proxyAuth,
            query: lookupQuery ?? { album: '', artist: '', track: '' },
            settings,
        }),
    );
    const clipStreamUrl = data?.status === 'ok' ? data.clip.localStreamUrl : null;

    return {
        clipStreamUrl,
        currentSong,
        data,
        isLoading,
        lookupQuery,
        settings,
    };
};

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
    const { activeTab, clipModeActive } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { mediaPause } = usePlayer();
    const { mediaAutoNext } = usePlayerActions();
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
            video.pause();
            video.removeAttribute('src');
            video.load();
        };
    }, [clipStreamUrl, currentSong?.id]);

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
                    onPlay={handleVideoPlay}
                    preload="metadata"
                    ref={videoRef}
                    src={data.clip.localStreamUrl}
                />
            </div>
        </div>
    );
};
