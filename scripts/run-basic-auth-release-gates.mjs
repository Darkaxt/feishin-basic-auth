import { spawnSync } from 'node:child_process';

const full = process.argv.includes('--full');

const commands = [
    ['node', ['--test', 'scripts/tests/proxy-auth.test.mjs']],
    ['node', ['--test', 'scripts/tests/lidaclips.test.mjs']],
    ['node', ['--test', 'scripts/tests/default-playback.test.mjs']],
    ['node', ['--test', 'scripts/tests/fork-updater.test.mjs']],
    ['node', ['--test', 'scripts/tests/playback-restore.test.mjs']],
    ['node', ['--test', 'scripts/tests/lyrics.test.mjs']],
    ['node', ['--test', 'scripts/tests/dependency-security.test.mjs']],
    [
        'node',
        [
            '--test',
            'scripts/tests/genre-context-menu.test.mjs',
            'scripts/tests/visualizer-system-audio.test.mjs',
        ],
    ],
    ['corepack', ['pnpm', 'run', 'typecheck:node']],
    ['corepack', ['pnpm', 'run', 'typecheck:web']],
    ['corepack', ['pnpm', 'run', 'lint-code']],
    ['corepack', ['pnpm', 'run', 'lint-styles']],
    ['node', ['scripts/check-basic-auth-secrets.mjs']],
];

if (full) {
    commands.push(['node', ['scripts/basic-auth-smoke.mjs']]);
    commands.push(['node', ['scripts/clean-release-dist.mjs']]);
    commands.push(['corepack', ['pnpm', 'run', 'build:electron']]);
    commands.push(['corepack', ['pnpm', 'run', 'build:remote']]);
    commands.push([
        'corepack',
        ['pnpm', 'exec', 'electron-builder', '--win', '--publish', 'never'],
    ]);
    commands.push(['node', ['scripts/normalize-windows-latest-yml.mjs']]);
    commands.push(['node', ['scripts/check-release-artifacts.mjs']]);
}

for (const [command, args] of commands) {
    console.log(`\n> ${command} ${args.join(' ')}`);

    const result =
        process.platform === 'win32' && command === 'corepack'
            ? spawnSync(`corepack ${args.join(' ')}`, {
                  shell: true,
                  stdio: 'inherit',
              })
            : spawnSync(command, args, {
                  stdio: 'inherit',
              });

    if (result.error) {
        console.error(result.error);
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}
