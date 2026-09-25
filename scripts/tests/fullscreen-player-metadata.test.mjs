/* eslint-disable @typescript-eslint/explicit-function-return-type -- Node runs this JavaScript regression directly. */
import assert from 'node:assert/strict';
import test from 'node:test';

import { dedupeFullscreenDateMetadataItems } from '../../src/shared/utils/fullscreen-player-metadata.ts';

const enabled = (id) => ({ disabled: false, id });
const disabled = (id) => ({ disabled: true, id });

test('keeps only the first enabled date metadata item with the same display value', () => {
    const items = [enabled('codec'), enabled('release_year'), enabled('year')];

    assert.deepEqual(
        dedupeFullscreenDateMetadataItems(items, {
            release_year: 2023,
            year: 2023,
        }),
        [enabled('codec'), enabled('release_year')],
    );
});

test('a disabled date item does not suppress a later enabled duplicate', () => {
    const items = [disabled('release_year'), enabled('year')];

    assert.deepEqual(
        dedupeFullscreenDateMetadataItems(items, {
            release_year: 2023,
            year: 2023,
        }),
        items,
    );
});

test('preserves distinct formatted date values and non-date metadata', () => {
    const items = [
        enabled('codec'),
        enabled('date'),
        enabled('release_date'),
        enabled('release_year'),
    ];

    assert.deepEqual(
        dedupeFullscreenDateMetadataItems(items, {
            date: '2023',
            release_date: '2023-09-15',
            release_year: 2023,
        }),
        [enabled('codec'), enabled('date'), enabled('release_date')],
    );
});
