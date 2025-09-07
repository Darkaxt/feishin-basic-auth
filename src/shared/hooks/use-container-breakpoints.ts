import { useResizeObserver } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import { Breakpoints } from '/@/shared/types/types';

export function useContainerBreakpoints() {
    const [ref, rect] = useResizeObserver();
    const [globalBreakpoints, setGlobalBreakpoints] = useState({
        '2xl': 0,
        '3xl': 0,
        lg: 0,
        md: 0,
        sm: 0,
        xl: 0,
    });

    useEffect(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);

        const getBreakpointValue = (breakpoint: string) => {
            const rootFontSize = 16;
            const value = computedStyle.getPropertyValue(`--theme-breakpoint-${breakpoint}`).trim();
            return parseInt(value, 10) * rootFontSize || 0;
        };

        setGlobalBreakpoints({
            '2xl': getBreakpointValue('2xl'),
            '3xl': getBreakpointValue('3xl'),
            lg: getBreakpointValue('lg'),
            md: getBreakpointValue('md'),
            sm: getBreakpointValue('sm'),
            xl: getBreakpointValue('xl'),
        });
    }, []);

    const isLargerThanSm = rect?.width >= globalBreakpoints.sm;
    const isLargerThanMd = rect?.width >= globalBreakpoints.md;
    const isLargerThanLg = rect?.width >= globalBreakpoints.lg;
    const isLargerThanXl = rect?.width >= globalBreakpoints.xl;
    const isLargerThan2xl = rect?.width >= globalBreakpoints['2xl'];
    const isLargerThan3xl = rect?.width >= globalBreakpoints['3xl'];

    const breakpoints: Breakpoints = {
        isLargerThan2xl,
        isLargerThan3xl,
        isLargerThanLg,
        isLargerThanMd,
        isLargerThanSm,
        isLargerThanXl,
    };

    return { breakpoints, rect, ref };
}
