import type {
    LyricsResponse,
    SyncedCueLine,
    SynchronizedLyricLine,
    SynchronizedLyrics,
} from '../types/domain-types';

export const LYRIC_LINE_BREAK = '_BREAK_';

const timeTagExp = /\[(\d{1,}):(\d{2})(?:[.:](\d{1,3}))?]/g;
const enhancedTimeTagExp = /<\d{1,}:\d{2}(?:[.:]\d{1,3})?>/g;
const offsetTagExp = /^\s*\[offset:([+-]?\d+)]\s*$/i;
const alternateTimeExp = /^\[(\d+),(\d+)](.*)$/;

const appendLyricLine = (existing: string, next: string) => {
    const cleanNext = next.trim();
    if (!cleanNext) return existing;
    if (existing.split(LYRIC_LINE_BREAK).includes(cleanNext)) return existing;
    if (!existing) return cleanNext;
    return `${existing}${LYRIC_LINE_BREAK}${cleanNext}`;
};

const parseTimeTag = (minute: string, second: string, milli?: string) => {
    const minutes = Number.parseInt(minute, 10);
    const seconds = Number.parseInt(second, 10);
    const milliseconds = milli == null ? 0 : Number.parseInt(milli.padEnd(3, '0').slice(0, 3), 10);

    return (minutes * 60 + seconds) * 1000 + milliseconds;
};

const cleanLyricText = (text: string) => text.replaceAll(enhancedTimeTagExp, '').trim();

const addSyncedLine = (
    lines: SynchronizedLyrics,
    lineIndexByTime: Map<number, number>,
    time: number,
    text: string,
    cueLines?: SyncedCueLine[],
) => {
    const cleanText = cleanLyricText(text);
    const existingIndex = lineIndexByTime.get(time);

    if (existingIndex == null) {
        lineIndexByTime.set(time, lines.length);
        lines.push({
            ...(cueLines ? { cueLines } : {}),
            startMs: time,
            text: cleanText,
        });
        return;
    }

    lines[existingIndex].text = appendLyricLine(lines[existingIndex].text, cleanText);
};

export const parseLyricsForDisplay = (lyrics: string): LyricsResponse => {
    const formattedLyrics: SynchronizedLyrics = [];
    const lineIndexByTime = new Map<number, number>();
    let offsetMs = 0;

    for (const rawLine of lyrics.split(/\r?\n/)) {
        const offsetMatch = rawLine.match(offsetTagExp);
        if (offsetMatch) {
            offsetMs = Number.parseInt(offsetMatch[1], 10);
            continue;
        }

        const timeMatches = [...rawLine.matchAll(timeTagExp)];
        if (timeMatches.length > 0) {
            const text = rawLine.replaceAll(timeTagExp, '');

            for (const match of timeMatches) {
                const [, minute, second, milli] = match;
                addSyncedLine(
                    formattedLyrics,
                    lineIndexByTime,
                    parseTimeTag(minute, second, milli) + offsetMs,
                    text,
                );
            }
            continue;
        }

        if (formattedLyrics.length > 0) {
            const cleanText = cleanLyricText(rawLine);
            if (cleanText) {
                const lastLine = formattedLyrics[formattedLyrics.length - 1];
                lastLine.text = appendLyricLine(lastLine.text, cleanText);
            }
        }
    }

    if (formattedLyrics.length > 0) {
        return formattedLyrics.sort((a, b) => a.startMs - b.startMs);
    }

    for (const rawLine of lyrics.split(/\r?\n/)) {
        const match = rawLine.match(alternateTimeExp);
        if (!match) continue;

        const [, timeInMilliseconds, , text] = match;
        const cleanText = text
            .replaceAll(/\(\d+,\d+\)/g, '')
            .replaceAll(/\s,/g, ',')
            .replaceAll(/\s\./g, '.')
            .trim();

        addSyncedLine(
            formattedLyrics,
            lineIndexByTime,
            Number.parseInt(timeInMilliseconds, 10),
            cleanText,
        );
    }

    if (formattedLyrics.length > 0) {
        return formattedLyrics.sort((a, b) => a.startMs - b.startMs);
    }

    return lyrics;
};

export const mergeSyncedLyricTranslations = (
    mainLyrics: SynchronizedLyrics,
    translationTracks: SynchronizedLyrics[],
): SynchronizedLyrics => {
    if (translationTracks.length === 0) return mainLyrics;

    const translationMaps = translationTracks.map(
        (track) => new Map(track.map((line) => [line.startMs, line.text])),
    );

    return mainLyrics.map((line, index) => {
        let mergedText = line.text;

        for (let trackIndex = 0; trackIndex < translationTracks.length; trackIndex += 1) {
            const exactMatch = translationMaps[trackIndex].get(line.startMs);
            const fallbackMatch = translationTracks[trackIndex][index]?.text;
            mergedText = appendLyricLine(mergedText, exactMatch ?? fallbackMatch ?? '');
        }

        return {
            ...line,
            text: mergedText,
        };
    });
};

export const mergeDuplicateSyncedLyricLines = (lyrics: SynchronizedLyrics): SynchronizedLyrics => {
    const mergedLyrics: SynchronizedLyrics = [];
    const lineIndexByTime = new Map<number, number>();

    for (const lyric of lyrics) {
        addSyncedLine(mergedLyrics, lineIndexByTime, lyric.startMs, lyric.text, lyric.cueLines);
    }

    return mergedLyrics.sort((a, b) => a.startMs - b.startMs);
};

export const toSynchronizedLyricLine = (
    lyric: [number, string] | SynchronizedLyricLine,
): SynchronizedLyricLine =>
    Array.isArray(lyric)
        ? {
              startMs: lyric[0],
              text: lyric[1],
          }
        : lyric;

export const formatLyricTextForExport = (text: string) => {
    return text.split(LYRIC_LINE_BREAK).join('\n');
};
