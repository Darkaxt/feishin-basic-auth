import {
    ApiController,
    ApiControllerError,
    ApiControllerFn,
} from '/@/shared/types/adapter/api-controller-types';
import { ServerListItem } from '/@/shared/types/domain/server-domain-types';
import { logger } from '/@/shared/utils/logger';

export interface LoggingOptions {
    logErrors?: boolean;
    logPerformance?: boolean;
    logRequests?: boolean;
    logResponses?: boolean;
    maxRequestSize?: number;
    maxResponseSize?: number;
}

type LoggedApiControllerFn<TRequest, TResponse> = (
    request: TRequest,
    server: ServerListItem,
    options?: any,
) => Promise<[ApiControllerError, null] | [null, TResponse]>;

export function createLoggedApiController(
    controller: ApiController,
    options: LoggingOptions = {},
): ApiController {
    const loggedController: any = {};

    // Log utility functions
    loggedController._utility = createLoggedUtility(controller._utility);

    // Log all controller methods
    for (const [sectionKey, section] of Object.entries(controller)) {
        if (sectionKey === '_utility') continue;

        loggedController[sectionKey] = {};

        for (const [methodKey, method] of Object.entries(section as Record<string, any>)) {
            if (typeof method === 'function') {
                const functionName = `${sectionKey}.${methodKey}`;

                if (methodKey === 'authenticate' || methodKey === 'getType') {
                    // Special handling for non-standard API functions
                    loggedController[sectionKey][methodKey] = (...args: any[]) => {
                        logger.info(`[API] ${functionName} called`, {
                            args: JSON.stringify(args, null, 2),
                        });
                        return method(...args);
                    };
                } else {
                    loggedController[sectionKey][methodKey] = createLoggedFunction(
                        method as ApiControllerFn<any, any>,
                        functionName,
                        options,
                    );
                }
            } else {
                loggedController[sectionKey][methodKey] = method;
            }
        }
    }

    return loggedController as ApiController;
}

function createLoggedFunction<TRequest, TResponse>(
    originalFn: ApiControllerFn<TRequest, TResponse> | undefined,
    functionName: string,
    options: LoggingOptions = {},
): LoggedApiControllerFn<TRequest, TResponse> | undefined {
    if (!originalFn) {
        return undefined;
    }

    return async (request: TRequest, server: ServerListItem, options?: any) => {
        const startTime = Date.now();
        const requestId = Math.random().toString(36).substring(2, 15);

        const {
            logErrors = true,
            logPerformance = true,
            logRequests = true,
            logResponses = true,
            maxRequestSize = 1000,
            maxResponseSize = 1000,
        } = options;

        if (logRequests) {
            const requestStr = JSON.stringify(request, null, 2);
            const truncatedRequest =
                requestStr.length > maxRequestSize
                    ? requestStr.substring(0, maxRequestSize) + '...'
                    : requestStr;

            logger.info(`[API] ${functionName} called`, {
                request: truncatedRequest,
                requestId,
                serverId: server.id,
                serverType: server.type,
            });
        }

        try {
            const result = await originalFn(request, server, options);
            const duration = Date.now() - startTime;

            if (result[0]) {
                // Error response
                if (logErrors) {
                    const error = result[0] as ApiControllerError;
                    logger.error(`[API] ${functionName} failed`, {
                        duration: logPerformance ? `${duration}ms` : undefined,
                        error: {
                            code: error.code,
                            message: error.message,
                        },
                        requestId,
                    });
                }
            } else {
                // Success response
                if (logResponses) {
                    const response = result[1];
                    const responseStr = JSON.stringify(response);
                    const truncatedResponse =
                        responseStr.length > maxResponseSize
                            ? responseStr.substring(0, maxResponseSize) + '...'
                            : responseStr;

                    logger.info(`[API] ${functionName} succeeded`, {
                        duration: logPerformance ? `${duration}ms` : undefined,
                        requestId,
                        response: truncatedResponse,
                        responseSize: responseStr.length,
                        responseType: typeof response,
                    });
                }
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (logErrors) {
                logger.error(`[API] ${functionName} threw exception`, {
                    duration: logPerformance ? `${duration}ms` : undefined,
                    error: error instanceof Error ? error.message : String(error),
                    requestId,
                    stack: error instanceof Error ? error.stack : undefined,
                });
            }
            throw error;
        }
    };
}

function createLoggedUtility<T extends Record<string, any>>(utility: T): T {
    const loggedUtility: any = {};

    for (const [key, value] of Object.entries(utility)) {
        if (typeof value === 'function') {
            loggedUtility[key] = (...args: any[]) => {
                logger.debug(`[API] _utility.${key} called`, {
                    args: JSON.stringify(args, null, 2),
                });
                return value(...args);
            };
        } else {
            loggedUtility[key] = value;
        }
    }

    return loggedUtility as T;
}
