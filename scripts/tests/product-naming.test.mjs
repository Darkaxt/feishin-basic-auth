import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const builderPaths = [
    'electron-builder.yml',
    'electron-builder-alpha.yml',
    'electron-builder-beta.yml',
];
const builderSources = builderPaths.map((path) => readFileSync(resolve(root, path), 'utf8'));
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const traySource = readFileSync(resolve(root, 'src/main/index.ts'), 'utf8');
const userDataPathFile = resolve(root, 'src/main/user-data-path.ts');
const userDataPathSource = existsSync(userDataPathFile)
    ? readFileSync(userDataPathFile, 'utf8')
    : '';
const artifactCheckSource = readFileSync(
    resolve(root, 'scripts/check-release-artifacts.mjs'),
    'utf8',
);

test('packaged products and artifacts use the Feishin public name', () => {
    assert.equal(packageJson.productName, 'Feishin');

    builderSources.forEach((source) => {
        assert.match(source, /^productName:\s*Feishin$/mu);
        assert.match(
            source,
            /^artifactName:\s*Feishin-\$\{version\}-\$\{os\}-\$\{arch\}\.\$\{ext\}$/mu,
        );
        assert.doesNotMatch(source, /Feishin[ -]BasicAuth/u);
    });

    assert.match(traySource, /tray\.setToolTip\('Feishin'\)/u);
});

test('renaming preserves upgrade and updater identities', () => {
    assert.equal(packageJson.name, 'feishin-basic-auth');

    builderSources.forEach((source) => {
        assert.match(source, /^appId:\s*eu\.remaxku\.feishin\.basicauth$/mu);
        assert.match(source, /^\s+repo:\s*feishin-basic-auth$/mu);
    });

    assert.match(traySource, /import '\.\/user-data-path';/u);
    assert.match(userDataPathSource, /LEGACY_USER_DATA_DIRNAME = 'Feishin BasicAuth'/u);
    assert.match(userDataPathSource, /app\.setPath\('userData'/u);
});

test('release validation rejects legacy BasicAuth artifact names', () => {
    assert.match(artifactCheckSource, /Legacy BasicAuth artifact names are not allowed/u);
    assert.match(artifactCheckSource, /Release artifacts must begin with Feishin-/u);
});
