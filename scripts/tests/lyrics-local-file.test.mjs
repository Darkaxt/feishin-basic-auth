import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import test from 'node:test';

const lyrics = await import('../../src/shared/utils/lyrics.ts');

const fixturePath = process.env.FEISHIN_LYRICS_FIXTURE_PATH;
const expectedLines = Number(process.env.FEISHIN_LYRICS_EXPECTED_LINES || 0);
const expectedTranslatedLines = Number(process.env.FEISHIN_LYRICS_EXPECTED_TRANSLATED_LINES || 0);

test(
    'local translated LRC fixture parses duplicate timestamps into dual lines',
    {
        skip:
            !fixturePath || !existsSync(fixturePath)
                ? 'Set FEISHIN_LYRICS_FIXTURE_PATH to run this local fixture test'
                : false,
    },
    () => {
        const text = readFileSync(fixturePath, 'utf8');
        const result = lyrics.parseLyricsForDisplay(text);

        assert.ok(Array.isArray(result));

        if (expectedLines > 0) {
            assert.equal(result.length, expectedLines);
        }

        const translatedLineCount = result.filter(([, line]) =>
            line.includes(lyrics.LYRIC_LINE_BREAK),
        ).length;

        if (expectedTranslatedLines > 0) {
            assert.equal(translatedLineCount, expectedTranslatedLines);
        } else {
            assert.ok(translatedLineCount > 0);
        }
    },
);
