import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { JukeboxControlQuery } from '/@/shared/types/domain-types';

export const jukeboxQueries = {
    jukeboxControl: (args: QueryHookArgs<JukeboxControlQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) =>
                api.controller.jukeboxControl({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                }),
            queryKey: queryKeys.jukebox.control(args.serverId, args.query),
        });
    },
};
