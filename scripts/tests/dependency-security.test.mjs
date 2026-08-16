import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lockfile = readFileSync(new URL('../../pnpm-lock.yaml', import.meta.url), 'utf8');
const electronBuilderConfigs = [
    '../../electron-builder.yml',
    '../../electron-builder-alpha.yml',
    '../../electron-builder-beta.yml',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

test('pnpm lockfile does not pin vulnerable fast-uri versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}fast-uri@3\.1\.[0-4]:$/mu);
});

test('pnpm lockfile does not pin vulnerable fast-xml-builder versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}fast-xml-builder@1\.1\.[56]:$/mu);
});

test('pnpm lockfile does not pin vulnerable tmp versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}tmp@0\.2\.[0-6]:$/mu);
});

test('pnpm lockfile does not pin vulnerable brace-expansion versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}brace-expansion@(?:[0-4]\.\d+\.\d+|5\.0\.[0-8]):$/mu);
});

test('pnpm lockfile does not pin vulnerable react-router versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}react-router@(?:[0-7]\.\d+\.\d+|8\.[0-2]\.\d+):/mu);
});

test('pnpm lockfile does not pin vulnerable postcss versions', () => {
    assert.doesNotMatch(
        lockfile,
        /^\s{2}postcss@(?:[0-7]\.\d+\.\d+|8\.[0-4]\.\d+|8\.5\.(?:\d|1\d|2[0-2])):$/mu,
    );
});

test('pnpm lockfile does not pin vulnerable dompurify versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}dompurify@3\.4\.(?:[0-9]|1[0-2]):$/mu);
});

test('pnpm lockfile does not pin vulnerable electron versions', () => {
    assert.doesNotMatch(
        lockfile,
        /^\s{2}electron@(?:40\.\d+\.\d+|41\.(?:[0-9]\.\d+|10\.[0-2])):$/mu,
    );
});

test('electron-builder configs do not package a vulnerable Electron runtime', () => {
    electronBuilderConfigs.forEach((config) => {
        assert.doesNotMatch(
            config,
            /^electronVersion:\s*(?:40\.\d+\.\d+|41\.(?:[0-9]\.\d+|10\.[0-2]))$/mu,
        );
    });
});

test('pnpm lockfile does not pin vulnerable esbuild versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}esbuild@0\.(?:1[7-9]|2[0-7])\./mu);
    assert.doesNotMatch(lockfile, /^\s{2}esbuild@0\.28\.0:/mu);
});

test('pnpm lockfile does not pin vulnerable shell-quote versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}shell-quote@1\.(?:[0-7]\.\d+|8\.[0-4]):$/mu);
});

test('pnpm lockfile does not pin vulnerable js-yaml versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}js-yaml@(?:[0-3]\.\d+\.\d+|4\.[0-2]\.\d+|4\.3\.0):$/mu);
});

test('pnpm lockfile does not pin vulnerable nanoid versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}nanoid@3\.3\.(?:[0-9]|1[0-7]):$/mu);
});

test('pnpm lockfile does not pin vulnerable tar versions', () => {
    assert.doesNotMatch(
        lockfile,
        /^\s{2}tar@(?:[0-6]\.\d+\.\d+|7\.[0-4]\.\d+|7\.5\.(?:\d|1\d|20)):/mu,
    );
});

test('pnpm lockfile does not pin vulnerable undici versions', () => {
    assert.doesNotMatch(lockfile, /^\s{2}undici@6\.(?:[0-9]|1[0-9]|2[0-7])\./mu);
});
