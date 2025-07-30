import { queryOptions, UseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api/api-controller';
import { AlbumListRequest } from '/@/shared/types/domain/album-domain-types';

export const getAlbumListQueryKey = (serverId: string, request?: AlbumListRequest) => {
    if (!request) {
        return [serverId, 'albums'];
    }

    return [serverId, 'albums', request];
};

export const getInfiniteAlbumListQueryKey = (serverId: string, request?: AlbumListRequest) => {
    if (!request) {
        return [serverId, 'albums', 'infinite'];
    }

    return [serverId, 'albums', 'infinite', request];
};

export const getAlbumList = async (serverId: string, request: AlbumListRequest) => {
    const [error, response] = await api.controller[serverId]!.album.getList!({
        query: request.query,
    });

    if (error) {
        throw new Error(error.message);
    }

    return response;
};

export const getAlbumListQuery = (
    serverId: string,
    request: AlbumListRequest,
    options?: UseQueryOptions,
) => {
    return queryOptions({
        enabled: !!serverId,
        queryFn: () => getAlbumList(serverId, request),
        queryKey: getAlbumListQueryKey(serverId, request),
        ...options,
    });
};
