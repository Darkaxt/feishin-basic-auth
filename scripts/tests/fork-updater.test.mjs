/* eslint-disable @typescript-eslint/explicit-function-return-type -- Plain Node test helpers around the production updater options. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

const mainSource = read('src/main/index.ts');
const updaterSource = read('src/main/fork-updater.ts');

// The production updater options, transpiled the same way the app build does.
const loadForkUpdaterOptions = () => {
    const exports = {};
    new Function(
        'exports',
        ts.transpileModule(read('src/main/fork-updater-options.ts'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
    )(exports);
    return exports;
};

const RELEASES = ['v1.15.1-ba.40', 'v1.15.1-ba.39', 'v1.15.1-ba.38'];
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
${RELEASES.map(
    (tag) => `<entry><id>${tag}</id><title>${tag}</title>
<link rel="alternate" type="text/html" href="https://github.com/Darkaxt/feishin-basic-auth/releases/tag/${tag}"/></entry>`,
).join('\n')}
</feed>`;
const latestYml = `version: 1.15.1-ba.40
files:
  - url: Feishin-1.15.1-ba.40-win.exe
    sha512: c2hh
    size: 1
path: Feishin-1.15.1-ba.40-win.exe
sha512: c2hh
releaseDate: '2026-11-19T16:20:00.000Z'
`;

// electron-updater's real GitHub provider, with the release server replaced by fixtures.
const resolveLatestRelease = async (options) => {
    const { GitHubProvider } = require(
        require.resolve('electron-updater/out/providers/GitHubProvider.js'),
    );
    const semver = require('semver');
    const requested = [];
    const executor = {
        request: async (request) => {
            requested.push(request.path);
            if (request.path.endsWith('/releases.atom')) return feed;
            if (request.path.endsWith('/releases/latest')) {
                return JSON.stringify({ tag_name: RELEASES[0] });
            }
            if (request.path.endsWith(`/download/${RELEASES[0]}/latest.yml`)) return latestYml;
            throw Object.assign(new Error(`404 ${request.path}`), { statusCode: 404 });
        },
    };
    const updater = {
        allowPrerelease: options.allowPrerelease,
        channel: options.channel,
        currentVersion: semver.parse('1.15.1-ba.38'),
    };
    const provider = new GitHubProvider(
        { owner: 'Darkaxt', provider: 'github', repo: 'feishin-basic-auth' },
        updater,
        { executor, isUseMultipleRangeRequest: false, platform: 'win32' },
    );
    return { info: await provider.getLatestVersion(), requested };
};

test('the fork updater options resolve the latest -ba release', async () => {
    const { FORK_UPDATER_OPTIONS } = loadForkUpdaterOptions();
    const semver = require('semver');

    const { info } = await resolveLatestRelease(FORK_UPDATER_OPTIONS);

    assert.equal(info.tag, 'v1.15.1-ba.40');
    assert.equal(info.version, '1.15.1-ba.40');
    assert.ok(semver.gt(info.version, '1.15.1-ba.38'));
    assert.equal(FORK_UPDATER_OPTIONS.allowDowngrade, false);
});

test('prerelease mode on the latest channel finds no fork release (the ba.40 failure)', async () => {
    await assert.rejects(
        resolveLatestRelease({ allowPrerelease: true, channel: 'latest' }),
        (error) => error.code === 'ERR_UPDATER_NO_PUBLISHED_VERSIONS',
    );
});

test('the fork updater downloads in the background and installs on restart or quit', () => {
    const { FORK_UPDATER_OPTIONS } = loadForkUpdaterOptions();

    assert.equal(FORK_UPDATER_OPTIONS.autoDownload, true);
    assert.equal(FORK_UPDATER_OPTIONS.autoInstallOnAppQuit, true);
    assert.match(updaterSource, /autoUpdater\.quitAndInstall\(true, true\)/u);
    // The channel setter re-enables downgrades, so allowDowngrade must be applied after it.
    assert.ok(
        updaterSource.indexOf('autoUpdater.channel =') <
            updaterSource.indexOf('autoUpdater.allowDowngrade ='),
    );
    assert.match(mainSource, /startForkUpdater\(/u);
    assert.match(mainSource, /beforeInstall: \(\) => \{\s*exitFromTray = true;/u);
});

test('the fork never updates from upstream channels', () => {
    for (const source of [mainSource, updaterSource]) {
        assert.ok(!source.includes('feishin-nightly-bucket'), 'no upstream nightly endpoint');
        assert.ok(!source.includes('checkForUpdatesAndNotify'), 'no OS-notification updater');
    }
    assert.doesNotMatch(
        read('src/renderer/features/settings/components/window/update-settings.tsx'),
        /release_channel/u,
    );
    assert.match(read('electron-builder.yml'), /owner: Darkaxt\s+repo: feishin-basic-auth/u);
});

test('renderer update checks and release notes target the fork', () => {
    const githubReleasesSource = read('src/renderer/hooks/use-github-releases.ts');
    const releaseNotesSource = read('src/renderer/release-notes-modal.tsx');
    const updateDialogSource = read('src/renderer/update-available-dialog.tsx');
    const updateButtonSource = read(
        'src/renderer/features/settings/components/update-available-button.tsx',
    );

    assert.match(
        githubReleasesSource,
        /api\.github\.com\/repos\/Darkaxt\/feishin-basic-auth\/releases/u,
    );
    assert.doesNotMatch(githubReleasesSource, /\$\{GITHUB_RELEASES_URL\}\/latest/u);
    assert.doesNotMatch(githubReleasesSource, /repos\/jeffvli\/feishin/u);
    assert.match(releaseNotesSource, /github\.com\/Darkaxt\/feishin-basic-auth/u);
    assert.doesNotMatch(releaseNotesSource, /github\.com\/jeffvli\/feishin/u);
    assert.match(updateDialogSource, /github\.com\/Darkaxt\/feishin-basic-auth/u);
    assert.match(updateDialogSource, /installUpdate/u);
    assert.match(updateButtonSource, /github\.com\/Darkaxt\/feishin-basic-auth/u);
    assert.match(updateButtonSource, /installUpdate/u);
});
