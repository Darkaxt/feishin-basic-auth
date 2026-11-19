// Library-derived artist relations, used when the server provides no artist genres or similar
// artists (Navidrome 0.55+ stores no artist genres, and similar artists depend on external agents).
// Kept free of imports so it can be executed in isolated Node fixtures.

interface AlbumLike {
    albumArtists?: RelatedArtistRef[];
    genres?: NamedRef[];
}

interface NamedRef {
    id: string;
    name: string;
}

interface RelatedArtistRef {
    id: string;
    imageId: null | string;
    imageUrl: null | string;
    name: string;
    userFavorite: boolean;
    userRating: null | number;
}

const IGNORED_ARTIST_NAMES = new Set(['[unknown artist]', 'unknown artist', 'various artists']);

// Rank the genres of an artist's albums by how many albums carry them.
export const deriveArtistGenresFromAlbums = (
    albums: AlbumLike[] | undefined,
    limit = 8,
): NamedRef[] => {
    const counts = new Map<string, { count: number; genre: NamedRef }>();

    for (const album of albums || []) {
        const seen = new Set<string>();
        for (const genre of album.genres || []) {
            if (!genre?.id || !genre.name || seen.has(genre.id)) continue;
            seen.add(genre.id);
            const entry = counts.get(genre.id);
            if (entry) entry.count += 1;
            else counts.set(genre.id, { count: 1, genre: { id: genre.id, name: genre.name } });
        }
    }

    return [...counts.values()]
        .sort((a, b) => b.count - a.count || a.genre.name.localeCompare(b.genre.name))
        .slice(0, limit)
        .map((entry) => entry.genre);
};

const normalizeName = (name: string) => name.trim().toLowerCase();

// Rank album artists from albums sharing the artist's genres. genreIds is ordered by relevance
// (primary genre first) and matches on earlier genres weigh more; ties go to more matching albums.
// Excludes the artist itself, given ids and collaboration aliases containing the artist's name.
export const rankArtistsBySharedGenres = (
    albums: AlbumLike[] | undefined,
    artistId: string,
    genreIds: string[],
    excludeIds: string[] = [],
    limit = 12,
    artistName = '',
): RelatedArtistRef[] => {
    const weights = new Map(genreIds.map((id, index) => [id, genreIds.length - index]));
    const excluded = new Set([artistId, ...excludeIds]);
    const ownName = normalizeName(artistName);
    const scores = new Map<
        string,
        { albums: number; artist: RelatedArtistRef; genres: Set<string>; order: number }
    >();
    const weightOf = (genres: Set<string>) =>
        [...genres].reduce((sum, id) => sum + (weights.get(id) ?? 0), 0);

    for (const album of albums || []) {
        const shared = (album.genres || []).filter((genre) => weights.has(genre.id));
        if (shared.length === 0) continue;
        const artists = album.albumArtists || [];
        // Skip collaborations that already include this artist.
        if (artists.some((artist) => artist.id === artistId)) continue;

        for (const artist of artists) {
            if (!artist?.id || excluded.has(artist.id)) continue;
            const name = normalizeName(artist.name);
            if (IGNORED_ARTIST_NAMES.has(name) || (ownName && name.includes(ownName))) continue;
            let entry = scores.get(artist.id);
            if (!entry) {
                entry = { albums: 0, artist, genres: new Set(), order: scores.size };
                scores.set(artist.id, entry);
            }
            entry.albums += 1;
            for (const genre of shared) entry.genres.add(genre.id);
        }
    }

    return [...scores.values()]
        .sort(
            (a, b) =>
                weightOf(b.genres) - weightOf(a.genres) || b.albums - a.albums || a.order - b.order,
        )
        .slice(0, limit)
        .map((entry) => entry.artist);
};
