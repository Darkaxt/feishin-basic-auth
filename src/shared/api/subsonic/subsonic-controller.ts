import createClient, { Client, Middleware } from 'openapi-fetch';
import qs from 'qs';

import { paths } from './subsonic-schema';

import i18n from '/@/i18n/i18n';
import { normalize } from '/@/shared/api/subsonic/subsonic-normalize';
import { API_CLIENT_NAME, ApiController } from '/@/shared/types/adapter/api-controller-types';
import { ApiControllerError } from '/@/shared/types/adapter/api-controller-types';
import { ServerListItem, ServerType } from '/@/shared/types/domain/server-domain-types';
import { LibraryItem } from '/@/shared/types/domain/shared-domain-types';

function deserializeCredential(credential: string): Record<string, string> {
    return JSON.parse(credential);
}

function serializeCredential(username: string, credential: Record<string, string>, type: string) {
    switch (type) {
        case 'apiKey':
            return JSON.stringify({ apiKey: credential.apiKey });
        case 'plaintext':
            return JSON.stringify({ p: credential.password, u: username });
        case 'token':
            return JSON.stringify({ s: credential.s, t: credential.t, u: username });
        default:
            throw new Error(`Invalid credential type: ${type}`);
    }
}

export const apiClient = createClient<paths>({
    querySerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
});

export const middleware: (server: ServerListItem) => Middleware = (server: ServerListItem) => ({
    onRequest: async ({ params }) => {
        const credential = deserializeCredential(server.credential);

        if (params.query) {
            params.query.v = '1.16.1';
            params.query.c = API_CLIENT_NAME;
            params.query.f = 'json';

            for (const [key, value] of Object.entries(credential)) {
                params.query[key] = value;
            }
        }
    },
});

const client: SubsonicClient = createClient<paths>({
    querySerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
});

type ErrorResponseArgs = {
    code?: number;
    message?: string;
};

type SubsonicClient = Client<paths, `${string}/${string}`>;

function errorResponse(args: ErrorResponseArgs): [ApiControllerError, null] {
    const message = `${i18n.t('error.genericError', { postProcess: 'sentenceCase' }) as string}${
        args.message ? `: ${args.message}` : ''
    }`;

    return [{ code: args.code || 500, message }, null];
}

function getSubsonicErrorMessage(subsonicErrorCode: number): string {
    switch (subsonicErrorCode) {
        case 0:
            return 'A generic error occurred';
        case 10:
            return 'Required parameter is missing';
        case 20:
            return 'Incompatible Subsonic REST protocol version. Client must upgrade';
        case 30:
            return 'Incompatible Subsonic REST protocol version. Server must upgrade';
        case 40:
            return 'Wrong username or password';
        case 41:
            return 'Token authentication not supported for LDAP users';
        case 50:
            return 'User is not authorized for the given operation';
        case 60:
            return 'The trial period for the Subsonic server is over. Please upgrade to Subsonic Premium';
        case 70:
            return 'The requested data was not found';
        default:
            return 'An unknown error occurred';
    }
}

function subsonicErrorResponse(
    subsonicErrorCode: number,
    customMessage?: string,
): [ApiControllerError, null] {
    const httpStatus = toHttpErrorCode(subsonicErrorCode);
    const message = customMessage || getSubsonicErrorMessage(subsonicErrorCode);

    return [{ code: httpStatus, message }, null];
}

/**
 * Maps Subsonic error codes to appropriate HTTP status codes
 * @param subsonicErrorCode - The Subsonic error code
 * @returns The corresponding HTTP status code
 */
function toHttpErrorCode(subsonicErrorCode: number): number {
    switch (subsonicErrorCode) {
        case 0:
            return 500; // Generic error - Internal Server Error
        case 10:
            return 400; // Required parameter is missing - Bad Request
        case 20:
            return 426; // Client must upgrade - Upgrade Required
        case 30:
            return 503; // Server must upgrade - Service Unavailable
        case 40:
            return 401; // Wrong username or password - Unauthorized
        case 41:
            return 403; // Token authentication not supported for LDAP users - Forbidden
        case 50:
            return 403; // User is not authorized for the given operation - Forbidden
        case 60:
            return 402; // Trial period over - Payment Required
        case 70:
            return 404; // The requested data was not found - Not Found
        default:
            return 500; // Unknown error - Internal Server Error
    }
}

export const controller: ApiController = {
    _utility: {
        getImageUrl: (
            args: { id: string; size?: number; type: LibraryItem },
            server: ServerListItem,
        ) => {
            return `${server.url}/rest/getCoverArt?id=${args.id}&size=${args.size || 300}`;
        },
        getStreamUrl: (
            args: { bitRate?: number; format?: string; id: string },
            server: ServerListItem,
        ) => {
            return `${server.url}/rest/stream?id=${args.id}&format=${args.format || 'mp3'}&maxBitRate=${args.bitRate || 320}`;
        },
    },
    album: {
        getDetail: async (request, server, options) => {
            const { data, error } = await client.GET('/rest/getAlbum', {
                baseUrl: server.url,
                params: { query: { id: request.query.id } },
                ...options,
            });

            if (error) {
                return errorResponse({ code: 500, message: error });
            }

            if (!data['subsonic-response']) {
                return errorResponse({ code: 404, message: 'No album found' });
            }

            if (data['subsonic-response'].status !== 'ok') {
                const errorCode = data['subsonic-response'].error.code;
                const errorMessage = data['subsonic-response'].error.message;
                return subsonicErrorResponse(errorCode, errorMessage);
            }

            return [null, normalize.album(data['subsonic-response'].album, server)];
        },
    },
    albumArtist: {
        // TODO: Implement album artist methods
    },
    artist: {
        // TODO: Implement artist methods
    },
    favorite: {
        // TODO: Implement favorite methods
    },
    genre: {
        // TODO: Implement genre methods
    },
    musicFolder: {
        // TODO: Implement music folder methods
    },
    playlist: {
        // TODO: Implement playlist methods
    },
    server: {
        authenticate: async (
            url: string,
            body: { legacy?: boolean; password: string; username: string },
        ) => {
            // TODO: Implement authentication logic
            throw new Error('Authentication not implemented yet');
        },
        getType: () => ServerType.SUBSONIC,
    },
    song: {
        // TODO: Implement song methods
    },
    user: {
        // TODO: Implement user methods
    },
};
