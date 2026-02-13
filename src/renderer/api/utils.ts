import { useAuthStore } from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { toast } from '/@/shared/components/toast/toast';
import { ServerListItem } from '/@/shared/types/types';

export const authenticationFailure = (currentServer: null | ServerListItem) => {
    logFn.error('Token expired', {
        category: LogCategory.API,
        meta: { serverId: currentServer?.id },
    });
    toast.error({
        message: 'Your session has expired.',
    });

    if (currentServer) {
        const serverId = currentServer.id;
        useAuthStore.getState().actions.updateServer(serverId, { ndCredential: undefined });
        useAuthStore.getState().actions.setCurrentServer(null);
    }
};
