import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const sourcePath = resolve(process.cwd(), 'src/main/index.ts');

test('fork updater targets BasicAuth prereleases without allowing downgrades', () => {
    const source = readFileSync(sourcePath, 'utf8');

    assert.match(source, /owner:\s*'Darkaxt'/u);
    assert.match(source, /repo:\s*'feishin-basic-auth'/u);
    assert.doesNotMatch(source, /allowPrerelease\s*=\s*false/u);
    assert.match(source, /allowDowngrade\s*=\s*false/u);
});
