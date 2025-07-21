import { useMutation } from '@tanstack/react-query';

import { api } from '/@/renderer/api/api-controller';
import { AuthenticationRequest } from '/@/shared/types/domain/auth-domain-types';
import { ServerType } from '/@/shared/types/domain/server-domain-types';

export function useSignIn() {
    const mutation = useMutation({
        mutationFn: (args: { request: AuthenticationRequest; serverType: ServerType }) => {
            const result = api.authenticate(args.serverType)(args.request);
            return result;
        },
    });

    return mutation;
}
