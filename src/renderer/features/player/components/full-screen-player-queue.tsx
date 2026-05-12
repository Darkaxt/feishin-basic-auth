import clsx from 'clsx';
import { motion } from 'motion/react';
import { CSSProperties, lazy, Suspense, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './full-screen-player-queue.module.css';

import {
    LidaClipsPanel,
    LidaClipsPlaybackCoordinator,
} from '/@/renderer/features/lidaclips/components/lidaclips-panel';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { FullScreenSimilarSongs } from '/@/renderer/features/player/components/full-screen-similar-songs';
import { useLidaClipsSettings, usePlaybackSettings, useSettingsStore } from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { ItemListKey } from '/@/shared/types/types';
import { shouldExitLidaClipsModeForTab, shouldShowLidaClipsTab } from '/@/shared/utils/lidaclips';

const AudioMotionAnalyzerVisualizer = lazy(() =>
    import('../../visualizer/components/audiomotionanalyzer/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

const ButterchurnVisualizer = lazy(() =>
    import('../../visualizer/components/butternchurn/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

export const FullScreenPlayerQueue = () => {
    const { t } = useTranslation();
    const { activeTab, expanded, opacity } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { webAudio } = usePlaybackSettings();
    const lidaClipsSettings = useLidaClipsSettings();
    const showLidaClipsTab = shouldShowLidaClipsTab(lidaClipsSettings);
    const visualizerType = useSettingsStore((store) => store.visualizer.type);

    useEffect(() => {
        if (activeTab === 'clips' && !showLidaClipsTab) {
            setStore({ activeTab: 'queue', clipModeActive: false });
        }
    }, [activeTab, setStore, showLidaClipsTab]);

    useEffect(() => {
        if (!expanded) {
            setStore({ clipModeActive: false });
        }
    }, [expanded, setStore]);

    useEffect(() => {
        return () => {
            setStore({ clipModeActive: false });
        };
    }, [setStore]);

    const setActiveTab = useCallback(
        (tab: string) => {
            setStore({
                activeTab: tab,
                ...(shouldExitLidaClipsModeForTab(tab) ? { clipModeActive: false } : {}),
            });
        },
        [setStore],
    );

    const headerItems = useMemo(() => {
        const items = [
            {
                active: activeTab === 'queue',
                label: t('page.fullscreenPlayer.upNext'),
                onClick: () => setActiveTab('queue'),
            },
            {
                active: activeTab === 'related',
                label: t('page.fullscreenPlayer.related'),
                onClick: () => setActiveTab('related'),
            },
            ...(showLidaClipsTab
                ? [
                      {
                          active: activeTab === 'clips',
                          label: t('page.fullscreenPlayer.clips'),
                          onClick: () => setActiveTab('clips'),
                      },
                  ]
                : []),
            {
                active: activeTab === 'lyrics',
                label: t('page.fullscreenPlayer.lyrics'),
                onClick: () => setActiveTab('lyrics'),
            },
        ];

        if (webAudio) {
            items.push({
                active: activeTab === 'visualizer',
                label: t('page.fullscreenPlayer.visualizer'),
                onClick: () => setActiveTab('visualizer'),
            });
        }

        return items;
    }, [activeTab, setActiveTab, showLidaClipsTab, t, webAudio]);

    return (
        <div
            className={clsx(styles.gridContainer, 'full-screen-player-queue-container')}
            style={
                {
                    '--opacity': opacity / 100,
                } as CSSProperties
            }
        >
            {showLidaClipsTab ? <LidaClipsPlaybackCoordinator /> : null}
            <Group
                align="center"
                className="full-screen-player-queue-header"
                gap={0}
                grow
                justify="center"
                pb="md"
            >
                {headerItems.map((item) => (
                    <div className={styles.headerItemWrapper} key={`tab-${item.label}`}>
                        <Button
                            flex={1}
                            fw="600"
                            onClick={item.onClick}
                            pos="relative"
                            size="lg"
                            uppercase
                            variant="transparent"
                        >
                            {item.label}
                        </Button>
                        {item.active ? (
                            <motion.div
                                className={styles.activeTabIndicator}
                                layoutId="underline"
                            />
                        ) : null}
                    </div>
                ))}
            </Group>
            {activeTab === 'queue' ? (
                <div className={styles.queueContainer}>
                    <PlayQueue
                        enableScrollShadow={false}
                        listKey={ItemListKey.FULL_SCREEN}
                        searchTerm={undefined}
                    />
                </div>
            ) : activeTab === 'related' ? (
                <div className={styles.queueContainer}>
                    <FullScreenSimilarSongs />
                </div>
            ) : activeTab === 'clips' && showLidaClipsTab ? (
                <LidaClipsPanel />
            ) : activeTab === 'lyrics' ? (
                <Lyrics fadeOutNoLyricsMessage={false} />
            ) : activeTab === 'visualizer' && webAudio ? (
                <Suspense fallback={<></>}>
                    {visualizerType === 'butterchurn' ? (
                        <ButterchurnVisualizer />
                    ) : (
                        <AudioMotionAnalyzerVisualizer />
                    )}
                </Suspense>
            ) : null}
        </div>
    );
};
