import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lidaclips-panel.module.css';

import {
    getLidaClipsQueryFromSong,
    lidaClipsQueries,
} from '/@/renderer/features/lidaclips/api/lidaclips-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useAuthStore, useLidaClipsSettings, usePlayerSong } from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import { createLidaClipsProxyAuthSourceFromServer } from '/@/shared/utils/lidaclips';

export const LidaClipsPanel = () => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const currentSong = usePlayerSong();
    const settings = useLidaClipsSettings();
    const { mediaPause } = usePlayer();
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
                enabled: Boolean(settings.enabled && lookupQuery),
            },
            proxyAuth,
            query: lookupQuery ?? { album: '', artist: '', track: '' },
            settings,
        }),
    );
    const clipStreamUrl = data?.status === 'ok' ? data.clip.localStreamUrl : null;

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
                    onPlay={mediaPause}
                    preload="metadata"
                    ref={videoRef}
                    src={data.clip.localStreamUrl}
                />
            </div>
        </div>
    );
};
