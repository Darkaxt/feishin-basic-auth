export function shouldShowFullscreenImagePlaceholder(
    src: null | string | undefined,
    failedSrc: null | string,
): boolean {
    return !src || src === failedSrc;
}
