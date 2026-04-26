/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createBasicAuthorizationHeader } from '../src/shared/utils/proxy-auth.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SMOKE_DIR = join(ROOT, 'scripts', 'basic-auth-smoke');
const AUTH_DIR = join(SMOKE_DIR, 'auth');
const DATA_DIR = join(SMOKE_DIR, 'data');
const PROXY_USER = 'proxy-user';
const PROXY_PASSWORD = 'proxy-pass';
const SMOKE_URL = 'http://127.0.0.1:38080';

const run = (command, args, options = {}) => {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        stdio: 'inherit',
        ...options,
    });

    if (result.status !== 0) {
        throw new Error(`${command} ${args.join(' ')} failed`);
    }
};

const shaPassword = (password) => {
    return `{SHA}${createHash('sha1').update(password).digest('base64')}`;
};

const waitForProxy = async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
            const response = await fetch(SMOKE_URL);

            if (response.status === 401) {
                return;
            }
        } catch {
            // Retry while Docker publishes the port.
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Traefik BasicAuth endpoint did not become ready');
};

mkdirSync(AUTH_DIR, { recursive: true });
mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(join(AUTH_DIR, 'htpasswd'), `${PROXY_USER}:${shaPassword(PROXY_PASSWORD)}\n`);

let started = false;

try {
    run('docker', [
        'compose',
        '-f',
        'scripts/basic-auth-smoke/docker-compose.yml',
        'up',
        '-d',
        '--wait',
    ]);
    started = true;

    await waitForProxy();

    const unauthenticated = await fetch(SMOKE_URL);

    if (unauthenticated.status !== 401) {
        throw new Error(
            `Expected unauthenticated request to return 401, got ${unauthenticated.status}`,
        );
    }

    const authenticated = await fetch(SMOKE_URL, {
        headers: {
            Authorization: createBasicAuthorizationHeader(PROXY_USER, PROXY_PASSWORD),
        },
    });

    if (authenticated.status === 401 || authenticated.status >= 500) {
        throw new Error(
            `Expected authenticated request to reach Navidrome, got ${authenticated.status}`,
        );
    }

    console.log('Traefik BasicAuth smoke passed.');
} finally {
    if (started && process.env.KEEP_BASIC_AUTH_SMOKE !== '1') {
        run('docker', [
            'compose',
            '-f',
            'scripts/basic-auth-smoke/docker-compose.yml',
            'down',
            '--volumes',
        ]);
    }
}
