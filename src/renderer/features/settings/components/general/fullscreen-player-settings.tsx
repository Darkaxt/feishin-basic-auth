import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface FullscreenPlayerSettingsProps {
    showDescription?: boolean;
}

import { DraggableItems } from '/@/renderer/features/settings/components/general/draggable-items';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import {
    PlayerItem,
    SortableItem,
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { Switch } from '/@/shared/components/switch/switch';

const PLAYER_ITEMS: Array<[PlayerItem, string]> = [
    [PlayerItem.TITLE, 'common.title'],
    [PlayerItem.ARTIST, 'entity.artist_one'],
    [PlayerItem.ALBUM, 'entity.album_one'],
    [PlayerItem.BIT_DEPTH, 'common.bitDepth'],
    [PlayerItem.BIT_RATE, 'common.bitrate'],
    [PlayerItem.BPM, 'common.bpm'],
    [PlayerItem.CODEC, 'common.codec'],
    [PlayerItem.DATE, 'filter.date'],
    [PlayerItem.DISC_NUMBER, 'table.config.label.discNumber'],
    [PlayerItem.GENRES, 'entity.genre_other'],
    [PlayerItem.RELEASE_DATE, 'filter.releaseDate'],
    [PlayerItem.RELEASE_TYPE, 'common.releaseType'],
    [PlayerItem.RELEASE_YEAR, 'filter.releaseYear'],
    [PlayerItem.SAMPLE_RATE, 'common.sampleRate'],
    [PlayerItem.TRACK_NUMBER, 'table.config.label.trackNumber'],
    [PlayerItem.YEAR, 'filter.year'],
];

export const FullscreenPlayerSettings = memo(
    ({ showDescription = true }: FullscreenPlayerSettingsProps) => {
        const { t } = useTranslation();
        const { playerItems } = useGeneralSettings();
        const { setPlayerItems } = useSettingsStoreActions();
        const { shrinkVinylArtworkOnPause, vinylArtworkEnabled } = useFullScreenPlayerStore();
        const { setStore } = useFullScreenPlayerStoreActions();

        return (
            <>
                <SettingsOptions
                    control={
                        <Switch
                            checked={vinylArtworkEnabled}
                            onChange={(event) =>
                                setStore({ vinylArtworkEnabled: event.currentTarget.checked })
                            }
                        />
                    }
                    description={t('page.fullscreenPlayer.config.vinylArtwork', {
                        context: 'description',
                    })}
                    showDescription={showDescription}
                    title={t('page.fullscreenPlayer.config.vinylArtwork')}
                />
                <SettingsOptions
                    control={
                        <Switch
                            checked={shrinkVinylArtworkOnPause}
                            disabled={!vinylArtworkEnabled}
                            onChange={(event) =>
                                setStore({
                                    shrinkVinylArtworkOnPause: event.currentTarget.checked,
                                })
                            }
                        />
                    }
                    description={t('page.fullscreenPlayer.config.shrinkVinylArtworkOnPause', {
                        context: 'description',
                    })}
                    showDescription={showDescription}
                    title={t('page.fullscreenPlayer.config.shrinkVinylArtworkOnPause')}
                />
                <DraggableItems
                    description="setting.playerItemConfiguration"
                    itemLabels={PLAYER_ITEMS}
                    items={playerItems as SortableItem<PlayerItem>[]}
                    nonReorderableItemIds={[PlayerItem.TITLE, PlayerItem.ARTIST, PlayerItem.ALBUM]}
                    setItems={setPlayerItems}
                    showDescription={showDescription}
                    title="setting.playerItemConfiguration"
                />
            </>
        );
    },
);
