/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve, sep } from 'node:path';

const distPath = resolve(process.cwd(), 'dist');
const latestPath = resolve(distPath, 'latest.yml');

const fail = (message) => {
    console.error(message);
    process.exitCode = 1;
};

if (!existsSync(latestPath)) {
    fail(`Missing ${latestPath}`);
    process.exit();
}

const latest = readFileSync(latestPath, 'utf8');
const references = [
    ...new Set(
        latest
            .split(/\r?\n/)
            .map((line) => line.match(/^\s*(?:-\s*)?(?:url|path):\s*(.+?)\s*$/)?.[1]?.trim())
            .filter(Boolean)
            .map((value) => value.replace(/^['"]|['"]$/g, ''))
            .filter((value) => !/^[a-z][a-z0-9+.-]*:/i.test(value)),
    ),
];
const primaryPath = latest
    .split(/\r?\n/)
    .map((line) => line.match(/^path:\s*(.+?)\s*$/)?.[1]?.trim())
    .find(Boolean)
    ?.replace(/^['"]|['"]$/g, '');

const missing = [];
const escaped = [];

for (const reference of references) {
    const artifactPath = resolve(distPath, reference);
    const insideDist = artifactPath === distPath || artifactPath.startsWith(`${distPath}${sep}`);

    if (!insideDist) {
        escaped.push(reference);
        continue;
    }

    if (!existsSync(artifactPath)) {
        missing.push(reference);
    }
}

if (escaped.length > 0) {
    fail(
        `latest.yml contains paths outside dist:\n${escaped.map((item) => `  - ${item}`).join('\n')}`,
    );
}

if (missing.length > 0) {
    fail(
        `latest.yml references missing artifacts:\n${missing.map((item) => `  - ${item}`).join('\n')}`,
    );
}

const releaseExtensions = new Set(['.blockmap', '.exe', '.zip']);
const releaseAssets = readdirSync(distPath)
    .filter((name) => statSync(resolve(distPath, name)).isFile())
    .filter((name) => releaseExtensions.has(name.match(/(\.blockmap|\.exe|\.zip)$/)?.[1] ?? ''));
const whitespaceAssets = releaseAssets.filter((name) => /\s/.test(name));
const legacyAssets = releaseAssets.filter((name) => /BasicAuth/iu.test(name));
const unexpectedNames = releaseAssets.filter((name) => !/^Feishin-/u.test(name));

if (whitespaceAssets.length > 0) {
    fail(
        `Release artifact filenames must not contain whitespace:\n${whitespaceAssets
            .map((item) => `  - ${item}`)
            .join('\n')}`,
    );
}

if (legacyAssets.length > 0) {
    fail(
        `Legacy BasicAuth artifact names are not allowed:\n${legacyAssets
            .map((item) => `  - ${item}`)
            .join('\n')}`,
    );
}

if (unexpectedNames.length > 0) {
    fail(
        `Release artifacts must begin with Feishin-:\n${unexpectedNames
            .map((item) => `  - ${item}`)
            .join('\n')}`,
    );
}

if (!primaryPath) {
    fail('latest.yml is missing the top-level update path.');
} else if (!/-win\.exe$/i.test(primaryPath)) {
    fail(`latest.yml update path must use the architecture-neutral installer: ${primaryPath}`);
}

if (process.exitCode) {
    process.exit();
}

console.log(
    `Validated ${references.length} latest.yml artifact references and ${readdirSync(distPath).length} dist entries.`,
);
console.log(`Primary update path: ${basename(primaryPath ?? '') || 'unknown'}`);
