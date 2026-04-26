import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ALLOWLIST = new Set(['scripts/tests/proxy-auth.test.mjs']);
const BASIC_HEADER_PATTERN = /\bAuthorization:\s*Basic\s+(?!<redacted>)[A-Za-z0-9+/=]{12,}/i;
const URL_CREDENTIAL_PATTERN = /https?:\/\/(?!<proxy-auth>@)[^/\s:@]+:[^/\s@]+@/i;

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
})
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => !ALLOWLIST.has(file.replaceAll('\\', '/')));

const findings = [];

for (const file of files) {
    const normalized = file.replaceAll('\\', '/');

    if (
        normalized.startsWith('node_modules/') ||
        normalized.startsWith('out/') ||
        normalized.startsWith('dist/') ||
        normalized.startsWith('release/')
    ) {
        continue;
    }

    const content = readFileSync(file, 'utf8');

    if (BASIC_HEADER_PATTERN.test(content)) {
        findings.push(`${file}: contains a literal Authorization Basic header`);
    }

    if (URL_CREDENTIAL_PATTERN.test(content)) {
        findings.push(`${file}: contains URL userinfo credentials`);
    }
}

if (findings.length > 0) {
    console.error(findings.join('\n'));
    process.exit(1);
}

console.log('No committed proxy BasicAuth secrets found.');
