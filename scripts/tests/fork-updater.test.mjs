import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const sourcePath = resolve(process.cwd(), 'src/main/index.ts');
const githubReleasesSourcePath = resolve(
    process.cwd(),
    'src/renderer/hooks/use-github-releases.ts',
);
const releaseNotesSourcePath = resolve(process.cwd(), 'src/renderer/release-notes-modal.tsx');
const updateDialogSourcePath = resolve(process.cwd(), 'src/renderer/update-available-dialog.tsx');
const updateButtonSourcePath = resolve(
    process.cwd(),
    'src/renderer/features/settings/components/update-available-button.tsx',
);

test('fork updater targets BasicAuth prereleases without allowing downgrades', () => {
    const source = readFileSync(sourcePath, 'utf8');

    assert.match(source, /owner:\s*'Darkaxt'/u);
    assert.match(source, /repo:\s*'feishin-basic-auth'/u);
    assert.doesNotMatch(source, /allowPrerelease\s*=\s*false/u);
    assert.match(source, /allowDowngrade\s*=\s*false/u);
});

test('renderer update checks and release notes target fork prereleases', () => {
    const githubReleasesSource = readFileSync(githubReleasesSourcePath, 'utf8');
    const releaseNotesSource = readFileSync(releaseNotesSourcePath, 'utf8');
    const updateDialogSource = readFileSync(updateDialogSourcePath, 'utf8');
    const updateButtonSource = readFileSync(updateButtonSourcePath, 'utf8');

    assert.match(
        githubReleasesSource,
        /api\.github\.com\/repos\/Darkaxt\/feishin-basic-auth\/releases/u,
    );
    assert.doesNotMatch(githubReleasesSource, /\$\{GITHUB_RELEASES_URL\}\/latest/u);
    assert.doesNotMatch(githubReleasesSource, /repos\/jeffvli\/feishin/u);
    assert.match(releaseNotesSource, /github\.com\/Darkaxt\/feishin-basic-auth/u);
    assert.doesNotMatch(releaseNotesSource, /github\.com\/jeffvli\/feishin/u);
    assert.match(updateDialogSource, /github\.com\/Darkaxt\/feishin-basic-auth/u);
    assert.doesNotMatch(updateDialogSource, /github\.com\/jeffvli\/feishin/u);
    assert.match(updateButtonSource, /github\.com\/Darkaxt\/feishin-basic-auth/u);
    assert.doesNotMatch(updateButtonSource, /github\.com\/jeffvli\/feishin/u);
});
