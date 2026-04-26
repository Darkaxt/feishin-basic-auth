import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const distPath = resolve(repoRoot, 'dist');

if (!distPath.startsWith(resolve(repoRoot))) {
    throw new Error(`Refusing to clean unexpected dist path: ${distPath}`);
}

rmSync(distPath, { force: true, recursive: true });
console.log(`Cleaned ${distPath}`);
