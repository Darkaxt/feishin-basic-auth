import { useEffect } from 'react';

import { useServerList } from '/@/renderer/store';
import { syncProxyAuthToMain } from '/@/renderer/utils/proxy-auth';

export const useSyncProxyAuthToMain = () => {
    const serverList = useServerList();

    useEffect(() => {
        syncProxyAuthToMain(Object.values(serverList));
    }, [serverList]);
};
