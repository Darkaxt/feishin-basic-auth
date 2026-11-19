import type { UpdaterStatus } from '/@/shared/types/updater';

import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

const utils = isElectron() ? window.api.utils : null;

// Follows the main-process updater (download progress and "ready to install").
export const useUpdaterStatus = (): UpdaterStatus => {
    const [status, setStatus] = useState<UpdaterStatus>({ state: 'idle' });

    useEffect(() => {
        if (!utils) return undefined;

        let active = true;
        const unsubscribe = utils.onUpdaterStatus(setStatus);
        utils
            .getUpdaterStatus()
            .then((current) => {
                if (active) setStatus(current);
            })
            .catch(() => undefined);

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    return status;
};

export const installUpdate = () => utils?.installUpdate();
