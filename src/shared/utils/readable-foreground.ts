const DARK = '#111111';
const LIGHT = '#ffffff';

// WCAG relative luminance of a #rrggbb colour.
const luminance = (hex: string) => {
    const channel = (offset: number) => {
        const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

// The text colour (near-black or white) with the higher WCAG contrast on a #rrggbb background.
export const readableForeground = (background: string): typeof DARK | typeof LIGHT => {
    const value = luminance(background);
    const onLight = 1.05 / (value + 0.05);
    const onDark = (value + 0.05) / (luminance(DARK) + 0.05);
    return onDark > onLight ? DARK : LIGHT;
};
