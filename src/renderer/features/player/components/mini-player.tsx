import formatDuration from 'format-duration';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './mini-player.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { PlayerbarSeekSlider } from '/@/renderer/features/player/components/playerbar-seek-slider';
import { VinylArtwork } from '/@/renderer/features/player/components/vinyl-artwork';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useMiniPlayerStore } from '/@/renderer/store/mini-player.store';
import { usePlayerSong, usePlayerStatus, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { usePlayerTimestamp } from '/@/renderer/store/timestamp.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Icon } from '/@/shared/components/icon/icon';
import { ExplicitStatus, LibraryItem } from '/@/shared/types/domain-types';
import { PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

const command = window.api?.browser?.miniPlayerCommand;

export const MiniPlayer = () => {
    const { t } = useTranslation();
    const { queueOpen } = useMiniPlayerStore();
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const time = usePlayerTimestamp();
    const player = usePlayer();
    const { blurExplicitImages } = useGeneralSettings();
    const restoreButton = useRef<HTMLButtonElement>(null);
    const surface = useRef<HTMLElement>(null);
    const image = useItemImageUrl({
        id: song?.imageId || undefined,
        imageUrl: song?.imageUrl,
        itemType: LibraryItem.SONG,
        serverId: song?._serverId,
        type: 'fullScreenPlayer',
    });
    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: image,
        srcLoaded: true,
    });
    const duration = (song?.duration ?? 0) / 1000;
    const paused = status !== PlayerStatus.PLAYING;
    useEffect(() => {
        // Give keyboard users access without forcing the hover overlay to stay visible.
        surface.current?.focus({ preventScroll: true });
    }, []);
    return (
        <section
            aria-label={t('miniPlayer.title')}
            className={styles.mini}
            ref={surface}
            tabIndex={-1}
        >
            {queueOpen && (
                <MiniQueue
                    onClose={() => {
                        void command({ action: 'queue', queueOpen: false });
                        restoreButton.current?.focus();
                    }}
                />
            )}
            <div className={styles.turntable} style={{ backgroundColor: background }}>
                <div aria-hidden="true" className={styles.grain} />
                <div
                    className={styles.artwork}
                    style={{
                        filter:
                            blurExplicitImages && song?.explicitStatus === ExplicitStatus.EXPLICIT
                                ? 'blur(20px)'
                                : undefined,
                    }}
                >
                    <VinylArtwork
                        enabled
                        expectedSrc={image}
                        isActiveSong={Boolean(song)}
                        isPlaying={!paused}
                        keepRecordOnPause={status !== PlayerStatus.STOPPED}
                        loading="eager"
                        motionProps={{}}
                        placeholder={<Icon icon="itemAlbum" size="45%" />}
                        requestKey={[song?._uniqueId, image].join('|')}
                        shrinkOnPause={false}
                        src={image}
                    />
                </div>
                <div className={styles.overlay}>
                    <div className={styles.top}>
                        <ActionIcon
                            aria-label={t('miniPlayer.dismiss')}
                            icon="x"
                            onClick={() => void command({ action: 'dismiss' })}
                            variant="subtle"
                        />
                        <div aria-hidden="true" className={styles.dragHandle} />
                        <ActionIcon
                            aria-label={t('miniPlayer.restore')}
                            icon="expand"
                            onClick={() => void command({ action: 'restore' })}
                            ref={restoreButton}
                            variant="subtle"
                        />
                    </div>
                    <div className={styles.transport}>
                        <ActionIcon
                            aria-label={t('miniPlayer.previous')}
                            disabled={!song}
                            icon="mediaPrevious"
                            onClick={() => player.mediaPrevious(false)}
                            size="lg"
                            variant="subtle"
                        />
                        <ActionIcon
                            aria-label={paused ? t('player.play') : t('player.pause')}
                            disabled={!song}
                            icon={paused ? 'mediaPlay' : 'mediaPause'}
                            onClick={player.mediaTogglePlayPause}
                            size="xl"
                            variant="filled"
                        />
                        <ActionIcon
                            aria-label={t('miniPlayer.next')}
                            disabled={!song}
                            icon="mediaNext"
                            onClick={() => player.mediaNext(false)}
                            size="lg"
                            variant="subtle"
                        />
                    </div>
                    <div className={styles.metadata}>
                        <div className={styles.track}>
                            <div>
                                <strong title={song?.name}>
                                    {song?.name || t('miniPlayer.empty')}
                                </strong>
                                <span title={song?.artistName}>{song?.artistName}</span>
                            </div>
                            <ActionIcon
                                aria-label={t('player.stop')}
                                disabled={!song || status === PlayerStatus.STOPPED}
                                icon="mediaStop"
                                onClick={() => player.mediaStop()}
                                variant="subtle"
                            />
                            <ActionIcon
                                aria-expanded={queueOpen}
                                aria-label={
                                    queueOpen
                                        ? t('miniPlayer.hideQueue')
                                        : t('miniPlayer.showQueue')
                                }
                                icon="queue"
                                onClick={() =>
                                    void command({ action: 'queue', queueOpen: !queueOpen })
                                }
                                variant="subtle"
                            />
                        </div>
                        <PlayerbarSeekSlider max={duration || 1} min={0} />
                        <div className={styles.times}>
                            <span>{formatDuration(time * 1000)}</span>
                            <span>{formatDuration(duration * 1000)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const MiniQueue = ({ onClose }: { onClose: () => void }) => {
    const { t } = useTranslation();
    const queue = usePlayerStoreBase((state) => state.queue);
    const shuffle = usePlayerStoreBase((state) => state.player.shuffle);
    const song = usePlayerSong();
    const { mediaPlay } = usePlayer();
    const currentRow = useRef<HTMLButtonElement>(null);
    const originalOrder = usePlayerStoreBase.getState().getQueue().items;
    const items =
        shuffle !== PlayerShuffle.NONE && queue.shuffled.length > 0
            ? queue.shuffled.map((index) => originalOrder[index]).filter(Boolean)
            : originalOrder;
    useEffect(() => {
        currentRow.current?.scrollIntoView({ block: 'nearest' });
    }, [song?._uniqueId, queue, shuffle]);
    return (
        <div aria-label={t('miniPlayer.playQueue')} className={styles.queue}>
            <header>
                <strong>{t('miniPlayer.queue')}</strong>
                <span>{t('miniPlayer.trackCount', { count: items.length })}</span>
                <ActionIcon
                    aria-label={t('miniPlayer.hideQueue')}
                    icon="x"
                    onClick={onClose}
                    variant="subtle"
                />
            </header>
            <div className={styles.queueList}>
                {items.map((item) => (
                    <button
                        aria-current={item._uniqueId === song?._uniqueId ? 'true' : undefined}
                        className={styles.queueRow}
                        key={item._uniqueId}
                        onClick={() => mediaPlay(item._uniqueId)}
                        ref={item._uniqueId === song?._uniqueId ? currentRow : undefined}
                        type="button"
                    >
                        <span>
                            <strong>{item.name}</strong>
                            <small>{item.artistName}</small>
                        </span>
                        <time>{formatDuration(item.duration)}</time>
                    </button>
                ))}
            </div>
        </div>
    );
};
