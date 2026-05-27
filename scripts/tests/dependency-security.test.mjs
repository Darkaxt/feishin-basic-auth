import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lockfile = readFileSync(new URL('../../pnpm-lock.yaml', import.meta.url), 'utf8');

test('pnpm lockfile does not pin vulnerable fast-uri versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}fast-uri@3\.1\.[01]:$/mu);
});

test('pnpm lockfile does not pin vulnerable fast-xml-builder versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}fast-xml-builder@1\.1\.[56]:$/mu);
});

test('pnpm lockfile does not pin vulnerable tmp versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}tmp@0\.2\.[0-5]:$/mu);
});

test('pnpm lockfile does not pin vulnerable brace-expansion 5.x versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}brace-expansion@5\.0\.[0-5]:$/mu);
});
