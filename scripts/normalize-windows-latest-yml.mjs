import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const latestPath = resolve(process.cwd(), 'dist', 'latest.yml');

if (!existsSync(latestPath)) {
    console.error(`Missing ${latestPath}`);
    process.exit(1);
}

const latest = readFileSync(latestPath, 'utf8');
const lines = latest.split(/\r?\n/);
const files = [];

for (let index = 0; index < lines.length; index += 1) {
    const url = lines[index].match(/^\s*-\s*url:\s*(.+?)\s*$/)?.[1]?.trim();

    if (!url) {
        continue;
    }

    const sha512 = lines[index + 1]?.match(/^\s*sha512:\s*(.+?)\s*$/)?.[1]?.trim();

    if (sha512) {
        files.push({
            sha512,
            url: url.replace(/^['"]|['"]$/g, ''),
        });
    }
}

const neutralInstaller = files.find((file) => /-win\.exe$/i.test(file.url));

if (!neutralInstaller) {
    console.error('latest.yml does not contain an architecture-neutral Windows installer.');
    process.exit(1);
}

let wrotePath = false;
let wroteSha512 = false;

const normalized = lines.map((line) => {
    if (/^path:\s*/.test(line)) {
        wrotePath = true;
        return `path: ${neutralInstaller.url}`;
    }

    if (/^sha512:\s*/.test(line)) {
        wroteSha512 = true;
        return `sha512: ${neutralInstaller.sha512}`;
    }

    return line;
});

if (!wrotePath || !wroteSha512) {
    console.error('latest.yml is missing the top-level path or sha512 field.');
    process.exit(1);
}

writeFileSync(latestPath, `${normalized.join('\n').replace(/\n+$/u, '')}\n`);
console.log(`Normalized latest.yml update path to ${neutralInstaller.url}`);
