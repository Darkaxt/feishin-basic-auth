import { strict as assert } from 'node:assert';
import test from 'node:test';

const lyrics = await import('../../src/shared/utils/lyrics.ts');

test('parseLyricsForDisplay merges duplicate timestamps as translated lyric lines', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:10.358]Original line
[00:10.358]Translated line
[00:12.918]Second original
[00:12.918]Second translation`);

    assert.deepEqual(result, [
        { startMs: 10358, text: 'Original line_BREAK_Translated line' },
        { startMs: 12918, text: 'Second original_BREAK_Second translation' },
    ]);
});

test('parseLyricsForDisplay collapses duplicate timestamps when the text is identical', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:10.358]Same line
[00:10.358]Same line`);

    assert.deepEqual(result, [{ startMs: 10358, text: 'Same line' }]);
});

test('parseLyricsForDisplay treats untimestamped continuation lines as translated lyric lines', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:01.000]Original line
Translated line
[00:02.500]Second original
Second translation`);

    assert.deepEqual(result, [
        { startMs: 1000, text: 'Original line_BREAK_Translated line' },
        { startMs: 2500, text: 'Second original_BREAK_Second translation' },
    ]);
});

test('parseLyricsForDisplay handles LRC offset, repeated timestamps, and enhanced LRC tags', () => {
    const result = lyrics.parseLyricsForDisplay(`[offset:100]
[00:01.000][00:02.000]<00:01.000>Hello <00:01.500>world`);

    assert.deepEqual(result, [
        { startMs: 1100, text: 'Hello world' },
        { startMs: 2100, text: 'Hello world' },
    ]);
});

test('parseLyricsForDisplay preserves a trailing blank timestamp from exported LRC files', () => {
    const result = lyrics.parseLyricsForDisplay(`[00:01.00]Original line
[00:01.00]Translated line
[00:02.00]`);

    assert.deepEqual(result, [
        { startMs: 1000, text: 'Original line_BREAK_Translated line' },
        { startMs: 2000, text: '' },
    ]);
});

test('mergeSyncedLyricTranslations appends OpenSubsonic translation tracks by timestamp', () => {
    const result = lyrics.mergeSyncedLyricTranslations(
        [
            { startMs: 2747, text: 'Original one' },
            { startMs: 6214, text: 'Original two' },
        ],
        [
            [
                { startMs: 2747, text: 'Translated one' },
                { startMs: 6214, text: 'Translated two' },
            ],
        ],
    );

    assert.deepEqual(result, [
        { startMs: 2747, text: 'Original one_BREAK_Translated one' },
        { startMs: 6214, text: 'Original two_BREAK_Translated two' },
    ]);
});

test('mergeDuplicateSyncedLyricLines folds duplicate OpenSubsonic timestamps into one line', () => {
    const result = lyrics.mergeDuplicateSyncedLyricLines([
        { startMs: 10358, text: 'Original line' },
        { startMs: 10358, text: 'Translated line' },
        { startMs: 12918, text: 'Second original' },
    ]);

    assert.deepEqual(result, [
        { startMs: 10358, text: 'Original line_BREAK_Translated line' },
        { startMs: 12918, text: 'Second original' },
    ]);
});

test('mergeSyncedLyricTranslations falls back to line index when timestamps differ', () => {
    const result = lyrics.mergeSyncedLyricTranslations(
        [
            { startMs: 1000, text: 'Original one' },
            { startMs: 2000, text: 'Original two' },
        ],
        [
            [
                { startMs: 1010, text: 'Translated one' },
                { startMs: 2010, text: 'Translated two' },
            ],
        ],
    );

    assert.deepEqual(result, [
        { startMs: 1000, text: 'Original one_BREAK_Translated one' },
        { startMs: 2000, text: 'Original two_BREAK_Translated two' },
    ]);
});

test('formatLyricTextForExport writes translated lyric layers on separate lines', () => {
    assert.equal(
        lyrics.formatLyricTextForExport('Original line_BREAK_Translated line'),
        'Original line\nTranslated line',
    );
});
