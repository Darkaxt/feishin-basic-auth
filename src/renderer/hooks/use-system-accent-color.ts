import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

const utils = isElectron() ? window.api.utils : null;

// The operating system accent colour (#rrggbb), updated live when the user changes it in
// Windows. Null where the platform has none or outside Electron.
export const useSystemAccentColor = (): null | string => {
    const [color, setColor] = useState<null | string>(null);

    useEffect(() => {
        if (!utils) return undefined;

        let active = true;
        const unsubscribe = utils.onSystemAccentColor(setColor);
        utils
            .getSystemAccentColor()
            .then((current) => {
                if (active) setColor(current);
            })
            .catch(() => undefined);

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    return color;
};
