import { UserPermissions } from '/@/shared/types/domain/user-domain-types';

export type AuthenticationRequest = {
    body: { password: string; username: string };
    url: string;
};

export type AuthenticationResponse = {
    credential: string;
    permissions: UserPermissions;
    username: string;
};
