import { useLayoutEffect, useState } from 'react';

import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/shared/types/types';

export interface ItemTableStickyLayoutOffsets {
    inViewMarginTop: number;
    stickyTop: number;
}

export function useItemTableStickyLayoutOffsets(): ItemTableStickyLayoutOffsets {
    const { windowBarStyle } = useWindowSettings();
    const isWinMac = windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS;

    const [offsets, setOffsets] = useState(() => ({
        inViewMarginTop: getFallbackInViewMargin(windowBarStyle),
        stickyTop: getFallbackStickyTop(windowBarStyle),
    }));

    useLayoutEffect(() => {
        const read = () => {
            const topVar = isWinMac
                ? '--item-table-sticky-top-win-mac'
                : '--item-table-sticky-top-default';
            const marginVar = isWinMac
                ? '--item-table-sticky-inview-margin-win-mac'
                : '--item-table-sticky-inview-margin-default';
            setOffsets({
                inViewMarginTop: resolveRootCssMarginLeftVar(
                    marginVar,
                    getFallbackInViewMargin(windowBarStyle),
                ),
                stickyTop: resolveRootCssWidthVar(topVar, getFallbackStickyTop(windowBarStyle)),
            });
        };

        read();
        window.addEventListener('resize', read);
        return () => window.removeEventListener('resize', read);
    }, [isWinMac, windowBarStyle]);

    return offsets;
}

function getFallbackInViewMargin(windowBarStyle: Platform): number {
    return windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS ? -130 : -100;
}

function getFallbackStickyTop(windowBarStyle: Platform): number {
    return windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS ? 95 : 65;
}

function resolveRootCssMarginLeftVar(varName: string, fallback: number): number {
    if (typeof document === 'undefined') return fallback;
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;left:0;top:0;margin-left:var(${varName});width:1px;height:0;margin-top:0;margin-right:0;margin-bottom:0;padding:0;border:none;visibility:hidden;pointer-events:none;`;
    document.body.appendChild(el);
    const raw = getComputedStyle(el).marginLeft;
    el.remove();
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : fallback;
}

function resolveRootCssWidthVar(varName: string, fallback: number): number {
    if (typeof document === 'undefined') return fallback;
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;left:-99999px;top:0;width:var(${varName});height:0;margin:0;padding:0;border:none;visibility:hidden;pointer-events:none;`;
    document.body.appendChild(el);
    const w = el.getBoundingClientRect().width;
    el.remove();
    return Number.isFinite(w) && w > 0 ? w : fallback;
}
