import { strict as assert } from 'node:assert';
import test from 'node:test';

const lyrics = await import('../../src/shared/utils/lyrics.ts');

test('parseLyricsForDisplay merges duplicate timestamps as translated lyric lines', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:10.358]Original line
[00:10.358]Translated line
[00:12.918]Second original
[00:12.918]Second translation`);

    assert.deepEqual(result, [
        [10358, 'Original line_BREAK_Translated line'],
        [12918, 'Second original_BREAK_Second translation'],
    ]);
});

test('parseLyricsForDisplay collapses duplicate timestamps when the text is identical', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:10.358]Same line
[00:10.358]Same line`);

    assert.deepEqual(result, [[10358, 'Same line']]);
});

test('parseLyricsForDisplay treats untimestamped continuation lines as translated lyric lines', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:01.000]Original line
Translated line
[00:02.500]Second original
Second translation`);

    assert.deepEqual(result, [
        [1000, 'Original line_BREAK_Translated line'],
        [2500, 'Second original_BREAK_Second translation'],
    ]);
});

test('parseLyricsForDisplay handles LRC offset, repeated timestamps, and enhanced LRC tags', () => {
    const result = lyrics.parseLyricsForDisplay(`[offset:100]
[00:01.000][00:02.000]<00:01.000>Hello <00:01.500>world`);

    assert.deepEqual(result, [
        [1100, 'Hello world'],
        [2100, 'Hello world'],
    ]);
});

test('parseLyricsForDisplay preserves a trailing blank timestamp from exported LRC files', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:01.00]Original line
[00:01.00]Translated line
[00:02.00]`);

    assert.deepEqual(result, [
        [1000, 'Original line_BREAK_Translated line'],
        [2000, ''],
    ]);
});

test('mergeSyncedLyricTranslations appends OpenSubsonic translation tracks by timestamp', () => {
    const result = lyrics.mergeSyncedLyricTranslations(
        [
            [2747, 'Original one'],
            [6214, 'Original two'],
        ],
        [
            [
                [2747, 'Translated one'],
                [6214, 'Translated two'],
            ],
        ],
    );

    assert.deepEqual(result, [
        [2747, 'Original one_BREAK_Translated one'],
        [6214, 'Original two_BREAK_Translated two'],
    ]);
});

test('mergeDuplicateSyncedLyricLines folds duplicate OpenSubsonic timestamps into one line', () => {
    const result = lyrics.mergeDuplicateSyncedLyricLines([
        [10358, 'Original line'],
        [10358, 'Translated line'],
        [12918, 'Second original'],
    ]);

    assert.deepEqual(result, [
        [10358, 'Original line_BREAK_Translated line'],
        [12918, 'Second original'],
    ]);
});

test('mergeSyncedLyricTranslations falls back to line index when timestamps differ', () => {
    const result = lyrics.mergeSyncedLyricTranslations(
        [
            [1000, 'Original one'],
            [2000, 'Original two'],
        ],
        [
            [
                [1010, 'Translated one'],
                [2010, 'Translated two'],
            ],
        ],
    );

    assert.deepEqual(result, [
        [1000, 'Original one_BREAK_Translated one'],
        [2000, 'Original two_BREAK_Translated two'],
    ]);
});

test('formatLyricTextForExport writes translated lyric layers on separate lines', () => {
    assert.equal(
        lyrics.formatLyricTextForExport('Original line_BREAK_Translated line'),
        'Original line\nTranslated line',
    );
});
