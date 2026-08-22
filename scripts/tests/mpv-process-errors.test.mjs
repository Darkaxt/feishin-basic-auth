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

test('production logging cannot recurse on a broken inherited console pipe', () => {
    const loggerSource = readFileSync(resolve('src/main/logger.ts'), 'utf8');
    const mainSource = readFileSync(resolve('src/main/index.ts'), 'utf8');
    const playerSource = readFileSync(resolve('src/main/features/core/player/index.ts'), 'utf8');
    const mainHandler = mainSource.match(/process\.on\('uncaughtException',[\s\S]*?\n\}\);/);
    const playerHandler = playerSource.match(/process\.on\('uncaughtException',[\s\S]*?\n\}\);/);

    assert.match(loggerSource, /const consoleLoggingEnabled =/);
    assert.match(loggerSource, /log\.transports\.console\.level = consoleLoggingEnabled/);
    assert.match(loggerSource, /process\.stdout\.on\('error', handleConsoleStreamError\)/);
    assert.match(loggerSource, /process\.stderr\.on\('error', handleConsoleStreamError\)/);
    assert.ok(mainHandler, 'missing main uncaughtException handler');
    assert.ok(playerHandler, 'missing player uncaughtException handler');
    assert.match(mainHandler[0], /if \(isBrokenPipeError\(error\)\)\s*\{\s*return;/);
    assert.match(playerHandler[0], /if \(isBrokenPipeError\(error\)\)\s*\{\s*return;/);
});
