import i18n from '/@/i18n/i18n';
import { useAuthStore } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { ServerListItem } from '/@/shared/types/types';

const AUTH_FAILURE_TOAST_ID = 'auth-failure';

export const authenticationFailure = (currentServer: null | ServerListItem, message?: string) => {
    const store = useAuthStore.getState();
    const serverId = currentServer?.id ?? store.currentServer?.id;

    if (!serverId || store.currentServer?.id !== serverId) return;
    const server = store.serverList[serverId];
    if (
        !server ||
        (currentServer?.ndCredential && currentServer.ndCredential !== server.ndCredential) ||
        (currentServer?.credential && currentServer.credential !== server.credential)
    ) {
        return;
    }

    toast.error({
        id: AUTH_FAILURE_TOAST_ID,
        message: message ?? (i18n.t('error.sessionExpiredError') as string),
    });

    // Session expiry does not revoke the user's choice to remember their password.
    // Explicit logout/forget owns password removal and the savePassword preference.
    store.actions.updateServer(serverId, { credential: '', ndCredential: undefined });
    store.actions.setCurrentServer(null);
};
