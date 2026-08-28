export function getFullscreenArtworkSlots(
    current: 0 | 1,
    topSrc: string | undefined,
    bottomSrc: string | undefined,
) {
    return [
        {
            active: current === 0,
            id: 'top' as const,
            render: current === 0 || Boolean(topSrc),
            src: topSrc,
        },
        {
            active: current === 1,
            id: 'bottom' as const,
            render: current === 1 || Boolean(bottomSrc),
            src: bottomSrc,
        },
    ];
}

export function shouldShowFullscreenImagePlaceholder(
    src: null | string | undefined,
    failedSrc: null | string,
): boolean {
    return !src || src === failedSrc;
}
