import formatDuration from 'format-duration';
import { type CSSProperties, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './mini-player.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { PlayerbarSeekSlider } from '/@/renderer/features/player/components/playerbar-seek-slider';
import { VinylArtwork } from '/@/renderer/features/player/components/vinyl-artwork';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useSystemAccentColor } from '/@/renderer/hooks/use-system-accent-color';
import { useMiniPlayerStore } from '/@/renderer/store/mini-player.store';
import { usePlayerSong, usePlayerStatus, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { usePlayerTimestamp } from '/@/renderer/store/timestamp.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Icon } from '/@/shared/components/icon/icon';
import { ExplicitStatus, LibraryItem } from '/@/shared/types/domain-types';
import { PlayerShuffle, PlayerStatus } from '/@/shared/types/types';
import { readableForeground } from '/@/shared/utils/readable-foreground';

const command = window.api?.browser?.miniPlayerCommand;
const MINI_PLAYER_IMAGE_SIZE = 800;

// Position updates arrive twice a second; keep them in leaf components so the turntable,
// transport controls and queue rows do not re-render on every tick.
const MiniProgress = ({ duration }: { duration: number }) => {
    const time = usePlayerTimestamp();
    return (
        <span>
            {duration > 0 ? Math.floor(Math.min(100, Math.max(0, (time / duration) * 100))) : 0}%
        </span>
    );
};

const MiniQueuePlayback = ({ duration }: { duration: number }) => {
    const time = usePlayerTimestamp();
    return (
        <div className={styles.queuePlayback}>
            <PlayerbarSeekSlider max={duration || 1} min={0} />
            <div className={styles.times}>
                <span>{formatDuration(time * 1000)}</span>
                <span>{formatDuration(duration * 1000)}</span>
            </div>
        </div>
    );
};

export const MiniPlayer = () => {
    const { t } = useTranslation();
    const queueOpen = useMiniPlayerStore((state) => state.queueOpen);
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const player = usePlayer();
    const { blurExplicitImages } = useGeneralSettings();
    const restoreButton = useRef<HTMLButtonElement>(null);
    const surface = useRef<HTMLElement>(null);
    // Follow the Windows accent colour live; controls switch to dark or light for contrast.
    const systemAccent = useSystemAccentColor();
    const accentStyle = useMemo(
        () =>
            systemAccent
                ? ({
                      '--mini-accent': systemAccent,
                      '--mini-on-accent': readableForeground(systemAccent),
                  } as CSSProperties)
                : undefined,
        [systemAccent],
    );
    const image = useItemImageUrl({
        id: song?.imageId || undefined,
        imageUrl: song?.imageUrl,
        itemType: LibraryItem.SONG,
        serverId: song?._serverId,
        // The square window stays small; avoid decoding original-size covers on every track.
        size: MINI_PLAYER_IMAGE_SIZE,
        type: 'fullScreenPlayer',
    });
    const duration = (song?.duration ?? 0) / 1000;
    const paused = status !== PlayerStatus.PLAYING;
    const closeQueue = useCallback(() => {
        void command({ action: 'queue', queueOpen: false });
        restoreButton.current?.focus();
    }, []);
    useEffect(() => {
        // Give keyboard users access without forcing the hover overlay to stay visible.
        surface.current?.focus({ preventScroll: true });
        return () => window.api.browser.miniPlayerDrag('end');
    }, []);
    return (
        <section
            aria-label={t('miniPlayer.title')}
            className={styles.mini}
            ref={surface}
            style={accentStyle}
            tabIndex={-1}
        >
            {queueOpen && <MiniQueue onClose={closeQueue} />}
            <div className={styles.turntable}>
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
                        <div
                            className={styles.dragHandle}
                            onLostPointerCapture={() => window.api.browser.miniPlayerDrag('end')}
                            onPointerDown={(event) => {
                                if (event.button !== 0) return;
                                event.currentTarget.setPointerCapture(event.pointerId);
                                window.api.browser.miniPlayerDrag('start');
                            }}
                            onPointerMove={(event) => {
                                if (event.currentTarget.hasPointerCapture(event.pointerId))
                                    window.api.browser.miniPlayerDrag('move');
                            }}
                            onPointerUp={(event) => {
                                if (event.currentTarget.hasPointerCapture(event.pointerId))
                                    event.currentTarget.releasePointerCapture(event.pointerId);
                            }}
                            title={t('miniPlayer.drag')}
                        >
                            <Icon icon="dragHorizontal" size={18} />
                        </div>
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
                            className={styles.previous}
                            disabled={!song}
                            icon="mediaPrevious"
                            iconProps={{ size: 18 }}
                            onClick={() => player.mediaPrevious(false)}
                            size={32}
                            variant="subtle"
                        />
                        <ActionIcon
                            aria-label={paused ? t('player.play') : t('player.pause')}
                            className={styles.playPause}
                            disabled={!song}
                            icon={paused ? 'mediaPlay' : 'mediaPause'}
                            iconProps={{ size: 18 }}
                            onClick={player.mediaTogglePlayPause}
                            size={32}
                            variant="subtle"
                        />
                        <ActionIcon
                            aria-label={t('miniPlayer.next')}
                            className={styles.next}
                            disabled={!song}
                            icon="mediaNext"
                            iconProps={{ size: 18 }}
                            onClick={() => player.mediaNext(false)}
                            size={32}
                            variant="subtle"
                        />
                        <ActionIcon
                            aria-label={t('player.stop')}
                            className={styles.stop}
                            disabled={!song || status === PlayerStatus.STOPPED}
                            icon="mediaStop"
                            iconProps={{ size: 18 }}
                            onClick={() => player.mediaStop()}
                            size={32}
                            variant="subtle"
                        />
                    </div>
                    <div className={styles.bottom}>
                        <MiniProgress duration={duration} />
                        <ActionIcon
                            aria-expanded={queueOpen}
                            aria-label={
                                queueOpen ? t('miniPlayer.hideQueue') : t('miniPlayer.showQueue')
                            }
                            icon="queue"
                            iconProps={{ size: 18 }}
                            onClick={() => void command({ action: 'queue', queueOpen: !queueOpen })}
                            size={32}
                            variant="subtle"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const MiniQueue = memo(function MiniQueue({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const queue = usePlayerStoreBase((state) => state.queue);
    const shuffle = usePlayerStoreBase((state) => state.player.shuffle);
    const song = usePlayerSong();
    const duration = (song?.duration ?? 0) / 1000;
    const { mediaPlay } = usePlayer();
    const currentRow = useRef<HTMLButtonElement>(null);
    const items = useMemo(() => {
        const originalOrder = usePlayerStoreBase.getState().getQueue().items;
        return shuffle !== PlayerShuffle.NONE && queue.shuffled.length > 0
            ? queue.shuffled.map((index) => originalOrder[index]).filter(Boolean)
            : originalOrder;
    }, [queue, shuffle]);
    useEffect(() => {
        currentRow.current?.scrollIntoView({ block: 'nearest' });
    }, [song?._uniqueId, queue, shuffle]);
    return (
        <div aria-label={t('miniPlayer.playQueue')} className={styles.queue} role="region">
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
            <MiniQueuePlayback duration={duration} />
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
});
