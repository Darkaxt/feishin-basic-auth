import { TFunction } from 'i18next';
import { Fragment, ReactNode } from 'react';
import { generatePath, Link } from 'react-router';

import { JoinedArtists } from '/@/renderer/features/albums/components/joined-artists';
import { AppRoute } from '/@/renderer/router/routes';
import { AlbumGroupItem } from '/@/renderer/store';
import { formatDurationString, formatPartialIsoDateUTC, formatSizeString } from '/@/renderer/utils';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { Text } from '/@/shared/components/text/text';
import { Genre, Song } from '/@/shared/types/domain-types';

export type AlbumGroupMetadata = {
    duration: number;
    genres: Genre[];
    releaseDate: Song['releaseDate'];
    releaseType: null | string;
    releaseYear: Song['releaseYear'];
    size: number;
    songCount: number;
};

export const computeAlbumGroupMetadata = (
    songs: Song[],
    songCount: number,
    t: TFunction,
): AlbumGroupMetadata => {
    const genreMap = new Map<string, Genre>();
    let duration = 0;
    let size = 0;

    for (const song of songs) {
        duration += song.duration ?? 0;
        size += song.size ?? 0;

        for (const genre of song.genres ?? []) {
            if (!genreMap.has(genre.id)) {
                genreMap.set(genre.id, genre);
            }
        }
    }

    const firstSong = songs[0];
    const releaseTypes = firstSong?.tags?.releasetype;
    const releaseType = releaseTypes?.length
        ? (normalizeReleaseTypes(releaseTypes, t)[0] ?? null)
        : null;

    return {
        duration,
        genres: Array.from(genreMap.values()),
        releaseDate: firstSong?.releaseDate ?? null,
        releaseType,
        releaseYear: firstSong?.releaseYear ?? null,
        size,
        songCount,
    };
};

const formatReleaseDate = (metadata: AlbumGroupMetadata): null | string => {
    if (metadata.releaseDate) {
        return formatPartialIsoDateUTC(metadata.releaseDate);
    }

    return null;
};

export const renderAlbumGroupMetadataItem = (
    itemId: AlbumGroupItem,
    song: Song | undefined,
    metadata: AlbumGroupMetadata,
    t: TFunction,
): null | ReactNode => {
    switch (itemId) {
        case AlbumGroupItem.ALBUM_ARTISTS:
            if (!song?.albumArtistName && !(song?.albumArtists?.length ?? 0)) {
                return null;
            }

            return (
                <JoinedArtists
                    artistName={song?.albumArtistName ?? ''}
                    artists={song?.albumArtists ?? []}
                    linkProps={{ fw: 400 }}
                    rootTextProps={{ fw: 400, size: 'xs' }}
                />
            );

        case AlbumGroupItem.DURATION:
            return metadata.duration > 0 ? (
                <Text size="xs">{formatDurationString(metadata.duration)}</Text>
            ) : null;

        case AlbumGroupItem.GENRES:
            if (metadata.genres.length === 0) {
                return null;
            }

            return (
                <>
                    {metadata.genres.map((genre, index) => (
                        <Fragment key={genre.id}>
                            <Text
                                component={Link}
                                fw={400}
                                isLink
                                size="xs"
                                state={{ item: genre }}
                                to={generatePath(AppRoute.LIBRARY_GENRES_DETAIL, {
                                    genreId: genre.id,
                                })}
                            >
                                {genre.name}
                            </Text>
                            {index < metadata.genres.length - 1 && ', '}
                        </Fragment>
                    ))}
                </>
            );

        case AlbumGroupItem.RELEASE_DATE: {
            const releaseDate = formatReleaseDate(metadata);
            return releaseDate ? <Text size="xs">{releaseDate}</Text> : null;
        }

        case AlbumGroupItem.RELEASE_TYPE:
            return metadata.releaseType ? <Text size="xs">{metadata.releaseType}</Text> : null;

        case AlbumGroupItem.RELEASE_YEAR:
            return metadata.releaseYear != null && metadata.releaseYear > 0 ? (
                <Text size="xs">{metadata.releaseYear}</Text>
            ) : null;

        case AlbumGroupItem.SIZE:
            return metadata.size > 0 ? (
                <Text size="xs">{formatSizeString(metadata.size)}</Text>
            ) : null;

        case AlbumGroupItem.SONG_COUNT:
            return metadata.songCount > 0 ? (
                <Text size="xs">{t('entity.trackWithCount', { count: metadata.songCount })}</Text>
            ) : null;

        default:
            return null;
    }
};
