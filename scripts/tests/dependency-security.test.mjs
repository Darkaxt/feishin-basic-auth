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
    assert.doesNotMatch(lockfile, /^\s{2}tmp@0\.2\.[0-6]:$/mu);
});

test('pnpm lockfile does not pin vulnerable brace-expansion versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}brace-expansion@1\.1\.(?:\d|1[0-5]):$/mu);
    assert.doesNotMatch(lockfile, /^\s{2}brace-expansion@2\.(?:0\.\d+|1\.[01]):$/mu);
    assert.doesNotMatch(lockfile, /^\s{2}brace-expansion@(?:[34]\.\d+\.\d+|5\.0\.[0-6]):$/mu);
});

test('pnpm lockfile does not pin vulnerable react-router versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}react-router@7\.(?:[0-9]|1[0-4])\./mu);
    assert.doesNotMatch(lockfile, /^\s{2}react-router@7\.15\.0:/mu);
});

test('pnpm lockfile does not pin vulnerable dompurify versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}dompurify@3\.4\.(?:[0-9]|10):$/mu);
});

test('pnpm lockfile does not pin vulnerable esbuild versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}esbuild@0\.(?:1[7-9]|2[0-7])\./mu);
    assert.doesNotMatch(lockfile, /^\s{2}esbuild@0\.28\.0:/mu);
});

test('pnpm lockfile does not pin vulnerable shell-quote versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}shell-quote@1\.(?:[0-7]\.|8\.[0-3]:)/mu);
});

test('pnpm lockfile does not pin vulnerable undici versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}undici@6\.(?:[0-9]|1[0-9]|2[0-6])\./mu);
});
