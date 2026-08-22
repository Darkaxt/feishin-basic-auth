import clsx from 'clsx';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './full-screen-player-queue.module.css';

import {
    LidaClipsPanel,
    LidaClipsPlaybackCoordinator,
} from '/@/renderer/features/lidaclips/components/lidaclips-panel';
import { useLidaClipsCurrentSongLookup } from '/@/renderer/features/lidaclips/hooks/use-lidaclips-current-song-lookup';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { FullScreenSimilarSongs } from '/@/renderer/features/player/components/full-screen-similar-songs';
import {
    useLidaClipsSettings,
    useListSettings,
    usePlaybackSettings,
    useSettingsStore,
} from '/@/renderer/store';
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

const moduleContentVariants: Variants = {
    animate: {
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
        x: 0,
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
        x: '10%',
    },
    initial: {
        opacity: 0,
        x: '10%',
    },
};

interface ControlItem {
    active: boolean;
    label: string;
    onClick: () => void;
}

const Controls = () => {
    const { t } = useTranslation();
    const { activeTab } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { webAudio } = usePlaybackSettings();
    const lidaClipsSettings = useLidaClipsSettings();
    const { data: lidaClipsData } = useLidaClipsCurrentSongLookup(lidaClipsSettings.enabled);
    const showLidaClipsTab = shouldShowLidaClipsTab({
        ...lidaClipsSettings,
        lookupStatus: lidaClipsData?.status,
    });

    const toggleTab = useCallback(
        (tab: string) => {
            const nextTab = activeTab === tab ? '' : tab;
            setStore({
                activeTab: nextTab,
                ...(shouldExitLidaClipsModeForTab(nextTab) ? { clipModeActive: false } : {}),
            });
        },
        [activeTab, setStore],
    );

    const headerItems = useMemo(() => {
        const items: ControlItem[] = [
            {
                active: activeTab === 'queue',
                label: t('page.fullscreenPlayer.upNext'),
                onClick: () => toggleTab('queue'),
            },
            {
                active: activeTab === 'related',
                label: t('page.fullscreenPlayer.related'),
                onClick: () => toggleTab('related'),
            },
            ...(showLidaClipsTab
                ? [
                      {
                          active: activeTab === 'clips',
                          label: t('page.fullscreenPlayer.clips'),
                          onClick: () => toggleTab('clips'),
                      },
                  ]
                : []),
            {
                active: activeTab === 'lyrics',
                label: t('page.fullscreenPlayer.lyrics'),
                onClick: () => toggleTab('lyrics'),
            },
        ];

        if (webAudio) {
            items.push({
                active: activeTab === 'visualizer',
                label: t('page.fullscreenPlayer.visualizer'),
                onClick: () => toggleTab('visualizer'),
            });
        }

        return items;
    }, [activeTab, showLidaClipsTab, t, toggleTab, webAudio]);

    return (
        <Group
            align="center"
            className={clsx(styles.controlsContainer, 'full-screen-player-controls-container')}
            gap={0}
            grow
            justify="center"
            pos="absolute"
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
                            layoutId="fullscreen-module-underline"
                        />
                    ) : null}
                </div>
            ))}
        </Group>
    );
};

export const FullScreenPlayerControls = Controls;

export const FullScreenPlayerQueue = () => {
    const { activeTab } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { webAudio } = usePlaybackSettings();
    const lidaClipsSettings = useLidaClipsSettings();
    const { data: lidaClipsData } = useLidaClipsCurrentSongLookup(lidaClipsSettings.enabled);
    const showLidaClipsTab = shouldShowLidaClipsTab({
        ...lidaClipsSettings,
        lookupStatus: lidaClipsData?.status,
    });
    const visualizerType = useSettingsStore((store) => store.visualizer.type);
    const { table } = useListSettings(ItemListKey.FULL_SCREEN) || {};
    const queueContainerClassName = clsx(styles.queueContainer, {
        [styles.queueContainerFadeTopBottom]: !table?.enableHeader,
    });

    useEffect(() => {
        if (activeTab === 'clips' && !showLidaClipsTab) {
            setStore({ activeTab: '', clipModeActive: false });
        }
    }, [activeTab, setStore, showLidaClipsTab]);

    useEffect(() => {
        return () => {
            setStore({ clipModeActive: false });
        };
    }, [setStore]);

    return (
        <div
            className={clsx(styles.gridContainer, 'full-screen-player-queue-container', {
                [styles.gridContainerCollapsed]: !activeTab,
            })}
        >
            {lidaClipsSettings.enabled ? <LidaClipsPlaybackCoordinator /> : null}
            <AnimatePresence mode="wait">
                {activeTab === 'queue' ? (
                    <motion.div
                        animate="animate"
                        className={queueContainerClassName}
                        exit="exit"
                        initial="initial"
                        key="queue"
                        variants={moduleContentVariants}
                    >
                        <PlayQueue
                            enableScrollShadow={false}
                            listKey={ItemListKey.FULL_SCREEN}
                            searchTerm={undefined}
                        />
                    </motion.div>
                ) : activeTab === 'related' ? (
                    <motion.div
                        animate="animate"
                        className={queueContainerClassName}
                        exit="exit"
                        initial="initial"
                        key="related"
                        variants={moduleContentVariants}
                    >
                        <FullScreenSimilarSongs />
                    </motion.div>
                ) : activeTab === 'clips' && showLidaClipsTab ? (
                    <motion.div
                        animate="animate"
                        className={styles.moduleContent}
                        exit="exit"
                        initial="initial"
                        key="clips"
                        variants={moduleContentVariants}
                    >
                        <LidaClipsPanel />
                    </motion.div>
                ) : activeTab === 'lyrics' ? (
                    <motion.div
                        animate="animate"
                        className={styles.moduleContent}
                        exit="exit"
                        initial="initial"
                        key="lyrics"
                        variants={moduleContentVariants}
                    >
                        <Lyrics fadeOutNoLyricsMessage={false} />
                    </motion.div>
                ) : activeTab === 'visualizer' && webAudio ? (
                    <motion.div
                        animate="animate"
                        className={styles.moduleContent}
                        exit="exit"
                        initial="initial"
                        key="visualizer"
                        variants={moduleContentVariants}
                    >
                        <Suspense fallback={<></>}>
                            {visualizerType === 'butterchurn' ? (
                                <ButterchurnVisualizer />
                            ) : (
                                <AudioMotionAnalyzerVisualizer />
                            )}
                        </Suspense>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};
