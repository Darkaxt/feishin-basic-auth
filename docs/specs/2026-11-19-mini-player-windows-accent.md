# November 19: mini-player follows the Windows accent (ba.42)

Authority: the user's 2026-11-19 report: "you didn't account for the background changing and the toolbar adapting to a new color". When asked what should follow the accent, they answered: "Overlay controls adapt, My main issue is that the widget is not tracking the Windows Accent color changes".

## Requirements

- R1: The mini-player widget takes its accent from the Windows system accent colour, and updates live when the user changes it in Windows (no restart).
- R2: The overlay controls (top toolbar, bottom bar and transport buttons) sit on the accent and keep a readable icon/text colour, dark on light accents and white on dark ones.
- R3: Where there is no system accent (non-Windows, web build), keep the theme primary with white controls.
- R4: Preserve the fork invariants in `docs/fork-maintenance.md`. Add a regression test, and release ba.42 with nine verified assets.

## Root cause

Feishin had no system-accent source: the widget's "accent" was the theme's `--theme-colors-primary`, so Windows accent changes never reached it. The overlay used fixed white controls over a black gradient, so it did not adapt either. After adding the accent, the transport buttons still showed transparent backgrounds with the theme foreground, because the shared ActionIcon `subtle` variant rules (specificity up to 0,4,0 for dark-mode hover) beat the widget's `.transport button` rules.

## Change

- `src/main/features/core/system-accent.ts` reads `systemPreferences.getAccentColor()` (RRGGBBAA, normalised to `#rrggbb`), serves it on `system-accent-color`, and on Windows re-reads on `accent-color-changed` and `color-changed`, broadcasting only real changes.
- The preload exposes `getSystemAccentColor()` and `onSystemAccentColor()`, and `useSystemAccentColor()` keeps the renderer value current.
- `readableForeground()` picks `#111111` or `#ffffff` by WCAG contrast. Mantine's `isLightColor` was rejected: it calls Windows blue `#0078d4` light.
- The widget sets `--mini-accent` and `--mini-on-accent`. The turntable background, toolbar chips, transport chips, focus outlines and queue highlights use them. The overlay control rules are scoped `.mini .overlay ... [data-variant]` so they win over the ActionIcon variant, hover and disabled rules.

## Verification

- `scripts/tests/system-accent.test.mjs` (3 tests, in the release gate): live change broadcast, no resend of unchanged colours, platform fallback, contrast choices, and the CSS wiring including the specificity-raised selectors.
- Release gate: all 28 test groups pass up to the expected corepack stop; ESLint, Stylelint, node and web `tsc`, and the secret scan pass when run directly.
- Hidden Electron harness (isolated profile, userData re-point blocked, live `config.json` hash unchanged): the stubbed accent was changed live to rust `#ad5d54`, amber `#ffb900` and blue `#0078d4`. Each time, the turntable, toolbar and transport computed backgrounds followed the accent, and the icon colour was white, `#111111` and white respectively. Screenshots matched.

## Delivery

Pending: ba.42 publication and verification.
