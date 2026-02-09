import { ItemDetailListCellProps } from './types';

import {
    JOINED_ARTISTS_MUTED_PROPS,
    JoinedArtists,
} from '/@/renderer/features/albums/components/joined-artists';
import { Text } from '/@/shared/components/text/text';

export const AlbumArtistColumn = ({ isRowHovered, song }: ItemDetailListCellProps) => {
    const name = song.albumArtistName?.trim() ?? '';
    const hasArtists = name.length > 0 || (song.albumArtists?.length ?? 0) > 0;

    if (!hasArtists) return <>&nbsp;</>;

    if (!isRowHovered) {
        return (
            <Text component="span" isMuted size="sm">
                {name}
            </Text>
        );
    }

    return (
        <JoinedArtists
            artistName={song.albumArtistName ?? ''}
            artists={song.albumArtists ?? []}
            linkProps={JOINED_ARTISTS_MUTED_PROPS.linkProps}
            rootTextProps={JOINED_ARTISTS_MUTED_PROPS.rootTextProps}
        />
    );
};
