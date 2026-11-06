import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const builderRequire = createRequire(require.resolve('electron-builder'));
const library = builderRequire.resolve('app-builder-lib');
const file = join(dirname(library), 'node-module-collector/nodeModulesCollector.js');
const dependencyRequire = createRequire(file);

test('packaging dependency collection waits for output handle close after process exit', async () => {
    const output = new EventEmitter();
    output.destroy = () => undefined;
    const child = new EventEmitter();
    child.stdout = { pipe: () => output };
    child.stderr = new EventEmitter();
    child.kill = () => undefined;
    const exports = {};
    vm.runInNewContext(readFileSync(file, 'utf8'), {
        Buffer,
        exports,
        process,
        require: (name) => {
            if (name === 'child_process') return { spawn: () => child };
            if (name === 'fs-extra')
                return { ...dependencyRequire(name), createWriteStream: () => output };
            return dependencyRequire(name);
        },
    });
    let settled = false;
    const pending = exports.NodeModulesCollector.prototype.streamCollectorCommandToFile
        .call({ cache: { logSummary: {} } }, 'pnpm', ['list'], process.cwd(), 'unused')
        .then(() => {
            settled = true;
        });
    child.emit('close', 0);
    output.emit('finish');
    await new Promise(setImmediate);
    assert.equal(settled, false, 'finish leaves the output handle open on Windows');
    output.emit('close');
    await pending;
    assert.equal(settled, true);
});

test('packaging spawn failure waits for output closure and preserves the original error', async () => {
    const output = new EventEmitter();
    output.destroy = () => undefined;
    const child = new EventEmitter();
    child.stdout = { pipe: () => output };
    child.stderr = new EventEmitter();
    child.kill = () => undefined;
    const exports = {};
    vm.runInNewContext(readFileSync(file, 'utf8'), {
        Buffer,
        exports,
        process,
        require: (name) => {
            if (name === 'child_process') return { spawn: () => child };
            if (name === 'fs-extra')
                return { ...dependencyRequire(name), createWriteStream: () => output };
            return dependencyRequire(name);
        },
    });
    let failure;
    const pending = exports.NodeModulesCollector.prototype.streamCollectorCommandToFile
        .call({ cache: { logSummary: {} } }, 'pnpm', ['list'], process.cwd(), 'unused')
        .catch((error) => {
            failure = error;
        });
    child.emit('error', new Error('spawn powershell.exe ENOENT'));
    await new Promise(setImmediate);
    assert.equal(
        failure,
        undefined,
        'a failed writer must close before retry diagnostics reopen its output',
    );
    output.emit('close');
    await pending;
    assert.match(failure.message, /spawn powershell.exe ENOENT/);
});
