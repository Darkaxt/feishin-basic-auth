import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('nonfatal unhandled rejections do not tear down mpv', () => {
    const source = readFileSync(resolve('src/main/features/core/player/index.ts'), 'utf8');
    const handler = source.match(/process\.on\('unhandledRejection',[\s\S]*?\n\}\);/);

    assert.ok(handler, 'missing unhandledRejection handler');
    assert.match(handler[0], /log\.error\('Unhandled rejection:'/);
    assert.doesNotMatch(handler[0], /cleanupMpv/);
});

test('nonfatal uncaught exceptions do not tear down mpv', () => {
    const mainSource = readFileSync(resolve('src/main/index.ts'), 'utf8');
    const playerSource = readFileSync(resolve('src/main/features/core/player/index.ts'), 'utf8');
    const mainHandler = mainSource.match(/process\.on\('uncaughtException',[\s\S]*?\n\}\);/);

    assert.ok(mainHandler, 'missing main uncaughtException handler');
    assert.match(mainHandler[0], /log\.error\('Error in main process'/);
    assert.doesNotMatch(playerSource, /process\.on\('uncaughtException'/);
});

test('unexpected mpv exits request recovery while intentional exits do not', () => {
    const source = readFileSync(resolve('src/main/features/core/player/index.ts'), 'utf8');

    assert.match(source, /const expectedMpvProcesses = new WeakSet<ChildProcess>\(\)/);
    assert.match(source, /mpvProcess\?\.once\('exit', \(code, signal\) =>/);
    assert.match(source, /expectedMpvProcesses\.has\(mpvProcess\)/);
    assert.match(source, /expectedMpvProcesses\.add\(mpvProcess\)/);
    assert.match(source, /MPV process exited unexpectedly/);
    assert.match(source, /webContents\.send\('renderer-mpv-reconnect'/);
});

test('unexpected mpv recovery resumes from the latest matching song position', () => {
    const source = readFileSync(
        resolve('src/renderer/features/player/audio-player/engine/mpv-player-engine.tsx'),
        'utf8',
    );

    assert.match(source, /const recoveryPositionRef = useRef/);
    assert.match(source, /recoveryPositionRef\.current = \{[\s\S]*songId:[\s\S]*timestamp:/);
    assert.match(
        source,
        /startTime: getRestoredPlaybackStartTime\(\{[\s\S]*savedSongId:[\s\S]*savedTimestamp:/,
    );
    assert.match(source, /recoveryPositionRef\.current = null/);
});

test('production logging cannot recurse on a broken inherited console pipe', () => {
    const loggerSource = readFileSync(resolve('src/main/logger.ts'), 'utf8');
    const mainSource = readFileSync(resolve('src/main/index.ts'), 'utf8');
    const playerSource = readFileSync(resolve('src/main/features/core/player/index.ts'), 'utf8');
    const mainHandler = mainSource.match(/process\.on\('uncaughtException',[\s\S]*?\n\}\);/);

    assert.match(loggerSource, /const consoleLoggingEnabled =/);
    assert.match(loggerSource, /log\.transports\.console\.level = consoleLoggingEnabled/);
    assert.match(loggerSource, /process\.stdout\.on\('error', handleConsoleStreamError\)/);
    assert.match(loggerSource, /process\.stderr\.on\('error', handleConsoleStreamError\)/);
    assert.ok(mainHandler, 'missing main uncaughtException handler');
    assert.match(mainHandler[0], /if \(isBrokenPipeError\(error\)\)\s*\{\s*return;/);
    assert.doesNotMatch(playerSource, /process\.on\('uncaughtException'/);
});

test('mpv shutdown targets node-mpv child process and waits for its exit', () => {
    const source = readFileSync(resolve('src/main/features/core/player/index.ts'), 'utf8');
    const cleanup = source.match(/const cleanupMpv = async[\s\S]*?\n\};/);

    assert.ok(cleanup, 'missing cleanupMpv helper');
    assert.match(source, /\.mpvPlayer/);
    assert.match(source, /waitForMpvProcessExit/);
    assert.doesNotMatch(source, /const QUIT_TIMEOUT_MS/);
    assert.doesNotMatch(source, /\.mpvProcess|\(instance as any\)\.process/);
    assert.doesNotMatch(cleanup[0], /instance\.stop/);
});
