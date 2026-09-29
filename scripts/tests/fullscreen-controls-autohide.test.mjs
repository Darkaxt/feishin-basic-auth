/* eslint-disable @typescript-eslint/explicit-function-return-type -- Node runs this JavaScript regression directly. */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const readSource = (path) => {
    const absolutePath = resolve(path);
    return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

test('whole-document fullscreen controls hide after three seconds of inactivity', () => {
    const hook = readSource('src/renderer/hooks/use-fullscreen-controls-auto-hide.ts');

    assert.match(hook, /FULLSCREEN_CONTROLS_IDLE_MS = 3_000/);
    assert.match(hook, /document\.fullscreenElement === document\.documentElement/);
    assert.match(hook, /window\.setTimeout\([\s\S]*setControlsHidden\(true\)/);
    assert.match(hook, /fullscreenchange/);
});

test('fullscreen activity reveals controls and restarts the idle interval', () => {
    const hook = readSource('src/renderer/hooks/use-fullscreen-controls-auto-hide.ts');

    for (const eventName of ['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel']) {
        assert.match(hook, new RegExp(`['"]${eventName}['"]`));
    }

    assert.match(hook, /setControlsHidden\(false\)/);
    assert.match(hook, /clearTimeout/);
    assert.match(hook, /removeEventListener/);
});

test('default layout collapses and fades both fullscreen control bars', () => {
    const layout = readSource('src/renderer/layouts/default-layout.tsx');
    const layoutStyles = readSource('src/renderer/layouts/default-layout.module.css');
    const windowBar = readSource('src/renderer/layouts/window-bar.tsx');

    assert.match(layout, /useFullscreenControlsAutoHide/);
    assert.match(layout, /styles\.fullscreenControlsHidden/);
    assert.match(windowBar, /id="window-bar"/);
    assert.match(
        layoutStyles,
        /\.fullscreen-controls-hidden[\s\S]*grid-template-rows:\s*0 100dvh 0/,
    );
    assert.match(layoutStyles, /#window-bar/);
    assert.match(layoutStyles, /#player-bar/);
    assert.match(layoutStyles, /opacity:\s*0/);
    assert.match(layoutStyles, /pointer-events:\s*none/);
    assert.match(layoutStyles, /cursor:\s*none/);
    assert.match(layoutStyles, /prefers-reduced-motion:\s*reduce/);
});

test('fullscreen player fills the resized main-content row when controls hide', () => {
    const fullScreenPlayer = readSource(
        'src/renderer/features/player/components/full-screen-player.tsx',
    );

    const containerVariants = fullScreenPlayer.match(
        /const containerVariants:[\s\S]*?interface PlayerContainerProps/,
    )?.[0];

    assert.ok(containerVariants, 'fullscreen player container variants must exist');
    assert.doesNotMatch(containerVariants, /calc\(100vh - (?:90|120)px\)/);
    assert.equal(containerVariants.match(/height:\s*'100%'/g)?.length, 2);
});

test('fullscreen dark tint composites theme noise above its color to prevent banding', () => {
    const playerStyles = readSource(
        'src/renderer/features/player/components/full-screen-player.module.css',
    );

    const backgroundOverlay = playerStyles.match(/\.background-overlay\s*\{[\s\S]*?\}/)?.[0];

    assert.ok(backgroundOverlay, 'fullscreen background overlay styles must exist');
    assert.match(backgroundOverlay, /background-image:\s*var\(--theme-background-noise\)/);
});
