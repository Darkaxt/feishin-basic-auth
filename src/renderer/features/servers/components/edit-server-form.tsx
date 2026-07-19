import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryClient } from '/@/renderer/lib/react-query';
import { getServerById, useAuthStoreActions, useServerList } from '/@/renderer/store';
import { syncProxyAuthToMain } from '/@/renderer/utils/proxy-auth';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { useFocusTrap } from '/@/shared/hooks/use-focus-trap';
import { useForm } from '/@/shared/hooks/use-form';
import {
    AuthenticationResponse,
    ServerListItem,
    ServerListItemWithCredential,
    ServerType,
} from '/@/shared/types/domain-types';
import {
    getProxyBasicAuthSecretKey,
    ProxyBasicAuthConfig,
    sanitizeServerUrl,
} from '/@/shared/utils/proxy-auth';

const localSettings = isElectron() ? window.api.localSettings : null;

interface EditServerFormProps {
    isUpdate?: boolean;
    onCancel: () => void;
    password: null | string;
    server: ServerListItem;
}

const ModifiedFieldIndicator = () => {
    return (
        <Tooltip label={i18n.t('common.modified') as string}>
            <Icon color="warn" icon="info" />
        </Tooltip>
    );
};

export const EditServerForm = ({ isUpdate, onCancel, password, server }: EditServerFormProps) => {
    const { t } = useTranslation();
    const { setCurrentServer, updateServer } = useAuthStoreActions();
    const serverList = useServerList();
    const focusTrapRef = useFocusTrap();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {
            isAdmin: server?.isAdmin,
            legacyAuth: false,
            name: server?.name,
            password: password || '',
            preferInstantMix: server.preferInstantMix,
            preferRemoteUrl: server?.preferRemoteUrl || false,
            proxyAuthEnabled: Boolean(server.proxyAuth?.enabled),
            proxyAuthPassword: '',
            proxyAuthUsername: server.proxyAuth?.username || '',
            remoteUrl: server?.remoteUrl || '',
            savePassword: server.savePassword,
            type: server?.type,
            url: server?.url,
            username: server?.username,
        },
    });

    const isSubsonic = form.values.type === ServerType.SUBSONIC;
    const isNavidrome = form.values.type === ServerType.NAVIDROME;
    const formUrlProxyPassword =
        sanitizeServerUrl(form.values.url).proxyPassword ||
        sanitizeServerUrl(form.values.remoteUrl).proxyPassword;
    const isProxyPasswordRequired =
        form.values.proxyAuthEnabled &&
        !server.proxyAuth?.enabled &&
        !form.values.proxyAuthPassword &&
        !formUrlProxyPassword;
    const isSubmitDisabled =
        form.values.proxyAuthEnabled &&
        (!form.values.proxyAuthUsername.trim() || isProxyPasswordRequired);

    const handleSubmit = form.onSubmit(async (values) => {
        let pendingProxySecretKey: string | undefined;
        let previousProxyPassword: null | string | undefined;

        try {
            setIsLoading(true);

            const sanitizedUrl = sanitizeServerUrl(values.url);
            const sanitizedRemoteUrl = values.remoteUrl?.trim()
                ? sanitizeServerUrl(values.remoteUrl)
                : undefined;
            const proxyAuthUsername =
                values.proxyAuthUsername.trim() ||
                sanitizedUrl.proxyUsername ||
                sanitizedRemoteUrl?.proxyUsername ||
                '';
            const proxyAuthPassword =
                values.proxyAuthPassword ||
                sanitizedUrl.proxyPassword ||
                sanitizedRemoteUrl?.proxyPassword ||
                '';
            const proxyAuth: ProxyBasicAuthConfig | undefined =
                values.proxyAuthEnabled || (proxyAuthUsername && proxyAuthPassword)
                    ? {
                          enabled: true,
                          type: 'basic',
                          username: proxyAuthUsername,
                      }
                    : undefined;

            if (values.proxyAuthEnabled && (!proxyAuthUsername || isProxyPasswordRequired)) {
                setIsLoading(false);
                return toast.error({
                    message: t('form.addServer.error', {
                        context: 'proxyPassword',
                        postProcess: 'sentenceCase',
                    }),
                });
            }

            if (localSettings && proxyAuth) {
                pendingProxySecretKey = getProxyBasicAuthSecretKey(server.id);
                previousProxyPassword = await localSettings.passwordGet(pendingProxySecretKey);

                if (proxyAuthPassword) {
                    const saved = await localSettings.passwordSet(
                        proxyAuthPassword,
                        pendingProxySecretKey,
                    );

                    if (!saved) {
                        setIsLoading(false);
                        return toast.error({
                            message: t('form.addServer.error', {
                                context: 'proxyPasswordSave',
                                postProcess: 'sentenceCase',
                            }),
                        });
                    }
                }

                syncProxyAuthToMain([
                    ...Object.values(serverList).filter((item) => item.id !== server.id),
                    {
                        id: server.id,
                        proxyAuth,
                        remoteUrl: sanitizedRemoteUrl?.url,
                        url: sanitizedUrl.url,
                    },
                ]);
            }

            // Check if we can skip authentication
            const usernameChanged = values.username !== server.username;
            const passwordProvided = values.password && values.password.trim() !== '';
            const urlChanged = sanitizedUrl.url !== server.url;
            const typeChanged = values.type !== server.type;

            // Skip authentication if username hasn't changed, password is empty, and URL/type haven't changed
            const canSkipAuth =
                !usernameChanged && !passwordProvided && !urlChanged && !typeChanged;

            let data: AuthenticationResponse | undefined;
            let serverItem: ServerListItemWithCredential;

            if (canSkipAuth) {
                // Use existing server credentials
                const existingServer = getServerById(server.id);
                if (!existingServer) {
                    return toast.error({
                        message: t('error.invalidServer'),
                    });
                }

                serverItem = {
                    ...existingServer,
                    id: server.id,
                    name: values.name,
                    proxyAuth,
                    type: values.type,
                    url: sanitizedUrl.url,
                };
            } else {
                // Need to authenticate
                const authFunction = api.controller.authenticate;

                if (!authFunction) {
                    return toast.error({
                        message: t('error.invalidServer'),
                    });
                }

                data = await authFunction(
                    sanitizedUrl.url,
                    {
                        legacy: values.legacyAuth,
                        password: values.password,
                        username: values.username,
                    },
                    values.type,
                );

                if (!data) {
                    return toast.error({
                        message: t('error.authenticationFailed'),
                    });
                }

                serverItem = {
                    credential: data.credential,
                    id: server.id,
                    isAdmin: data.isAdmin,
                    name: values.name,
                    proxyAuth,
                    type: values.type,
                    url: sanitizedUrl.url,
                    userId: data.userId,
                    username: data.username,
                };

                if (data.ndCredential !== undefined) {
                    serverItem.ndCredential = data.ndCredential;
                }
            }

            // Update optional fields
            if (values.preferInstantMix !== undefined) {
                serverItem.preferInstantMix = values.preferInstantMix;
            }

            if (values.savePassword !== undefined) {
                serverItem.savePassword = values.savePassword;
            }

            if (sanitizedRemoteUrl?.url) {
                serverItem.remoteUrl = sanitizedRemoteUrl.url;
            } else {
                serverItem.remoteUrl = undefined;
            }

            if (values.preferRemoteUrl !== undefined) {
                serverItem.preferRemoteUrl = values.preferRemoteUrl;
            }

            updateServer(server.id, serverItem);

            // After re-authenticating, switch to the updated server so the user
            // isn't left on the credentials / server-required screen.
            if (!canSkipAuth) {
                const updated = getServerById(server.id);
                if (updated) {
                    setCurrentServer(updated);
                }
            }

            toast.success({
                message: t('form.updateServer.title'),
            });

            // Handle password saving in local settings
            if (localSettings) {
                if (!proxyAuth) {
                    localSettings.passwordRemove(getProxyBasicAuthSecretKey(server.id));
                }

                if (canSkipAuth) {
                    // If we skipped auth, only update savePassword preference
                    // Don't change the actual saved password
                    if (!values.savePassword) {
                        localSettings.passwordRemove(server.id);
                    }
                } else {
                    // If we authenticated, update password if savePassword is enabled
                    if (values.savePassword && passwordProvided) {
                        const saved = await localSettings.passwordSet(values.password, server.id);
                        if (!saved) {
                            toast.error({
                                message: t('form.addServer.error', {
                                    context: 'savePassword',
                                }),
                            });
                        }
                    } else if (!values.savePassword) {
                        localSettings.passwordRemove(server.id);
                    }
                }
            }

            queryClient.removeQueries();
        } catch (err: any) {
            if (localSettings && pendingProxySecretKey) {
                if (previousProxyPassword) {
                    await localSettings.passwordSet(previousProxyPassword, pendingProxySecretKey);
                } else {
                    localSettings.passwordRemove(pendingProxySecretKey);
                }

                syncProxyAuthToMain(Object.values(serverList));
            }

            setIsLoading(false);
            return toast.error({ message: err?.message });
        }

        if (isUpdate) closeAllModals();
        return setIsLoading(false);
    });

    return (
        <form onSubmit={handleSubmit}>
            <Stack ref={focusTrapRef}>
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'name',
                    })}
                    required
                    rightSection={form.isDirty('name') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('name')}
                />
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'url',
                    })}
                    required
                    rightSection={form.isDirty('url') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('url')}
                />
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'remoteUrl',
                    })}
                    placeholder={t('form.addServer.input', {
                        context: 'remoteUrlPlaceholder',
                    })}
                    rightSection={form.isDirty('remoteUrl') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('remoteUrl')}
                />
                {form.values.remoteUrl && (
                    <Group gap="xs">
                        <Checkbox
                            label={t('form.addServer.input', {
                                context: 'preferRemoteUrl',
                            })}
                            {...form.getInputProps('preferRemoteUrl', {
                                type: 'checkbox',
                            })}
                        />
                        {form.isDirty('preferRemoteUrl') && <ModifiedFieldIndicator />}
                    </Group>
                )}
                {localSettings && (
                    <>
                        <Divider />
                        <Group gap="xs">
                            <Checkbox
                                description={t('form.addServer.input', {
                                    context: 'proxyBasicAuthDescription',
                                    postProcess: 'sentenceCase',
                                })}
                                label={t('form.addServer.input', {
                                    context: 'proxyBasicAuth',
                                    postProcess: 'titleCase',
                                })}
                                {...form.getInputProps('proxyAuthEnabled', {
                                    type: 'checkbox',
                                })}
                            />
                            {form.isDirty('proxyAuthEnabled') && <ModifiedFieldIndicator />}
                        </Group>
                        {form.values.proxyAuthEnabled && (
                            <Group grow>
                                <TextInput
                                    label={t('form.addServer.input', {
                                        context: 'proxyUsername',
                                        postProcess: 'titleCase',
                                    })}
                                    required
                                    rightSection={
                                        form.isDirty('proxyAuthUsername') && (
                                            <ModifiedFieldIndicator />
                                        )
                                    }
                                    {...form.getInputProps('proxyAuthUsername')}
                                />
                                <PasswordInput
                                    label={t('form.addServer.input', {
                                        context: 'proxyPassword',
                                        postProcess: 'titleCase',
                                    })}
                                    placeholder={
                                        server.proxyAuth?.enabled
                                            ? (t('form.addServer.input', {
                                                  context: 'proxyPasswordUnchanged',
                                                  postProcess: 'sentenceCase',
                                              }) as string)
                                            : undefined
                                    }
                                    required={!server.proxyAuth?.enabled}
                                    {...form.getInputProps('proxyAuthPassword')}
                                />
                            </Group>
                        )}
                        <Divider />
                    </>
                )}
                <TextInput
                    label={t('form.addServer.input', {
                        context: 'username',
                    })}
                    required
                    rightSection={form.isDirty('username') && <ModifiedFieldIndicator />}
                    {...form.getInputProps('username')}
                />
                <PasswordInput
                    data-autofocus
                    label={t('form.addServer.input', {
                        context: 'password',
                    })}
                    {...form.getInputProps('password')}
                />
                {localSettings && isNavidrome && (
                    <Checkbox
                        label={t('form.addServer.input', {
                            context: 'savePassword',
                        })}
                        {...form.getInputProps('savePassword', {
                            type: 'checkbox',
                        })}
                    />
                )}
                {isSubsonic && (
                    <Checkbox
                        label={t('form.addServer.input', {
                            context: 'legacyAuthentication',
                        })}
                        {...form.getInputProps('legacyAuth', {
                            type: 'checkbox',
                        })}
                    />
                )}
                {form.values.type === ServerType.JELLYFIN && (
                    <Checkbox
                        description={t('form.addServer.input', {
                            context: 'preferInstantMixDescription',
                        })}
                        label={t('form.addServer.input', {
                            context: 'preferInstantMix',
                        })}
                        {...form.getInputProps('preferInstantMix', {
                            type: 'checkbox',
                        })}
                    />
                )}
                <Group justify="flex-end">
                    <ModalButton onClick={onCancel}>{t('common.cancel')}</ModalButton>
                    <ModalButton
                        disabled={isSubmitDisabled}
                        loading={isLoading}
                        type="submit"
                        variant="filled"
                    >
                        {t('common.save')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};
