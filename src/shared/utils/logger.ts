import dayjs from 'dayjs';

export interface LogFn {
    (message?: any, ...optionalParams: any[]): void;
}

export interface Logger {
    debug: LogFn;
    error: LogFn;
    info: LogFn;
    warn: LogFn;
}

export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

const LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NO_OP: LogFn = (_message?: string, ..._optionalParams: any[]) => {};

const colors = {
    debug: '\x1B[38;2;54;96;146m', // #366092
    error: '\x1B[38;2;240;0;0m', // #f00000
    info: '\x1B[38;2;0;125;60m', // #007d3c
    warn: '\x1B[38;2;225;125;50m', // #e17d32
};

// Debounce configuration
const DEBOUNCE_INTERVAL = 200; // 200ms
const DEBOUNCE_MAP = new Map<string, { count: number; lastLog: number }>();

// Periodically flush the debounce map
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of DEBOUNCE_MAP.entries()) {
        if (now - value.lastLog >= DEBOUNCE_INTERVAL) {
            const [level, message, meta] = JSON.parse(key);
            const timestamp = dayjs().format('HH:mm:ss');
            const paddedLevel = level.toUpperCase().padEnd(5, ' ');
            const countStr = value.count > 1 ? ` (x${value.count})` : '';
            const logStr = `[${timestamp}] ${colors[level as keyof typeof colors]}[${paddedLevel}]\x1B[0m ${message}${countStr}`;
            console.log(logStr, getMetaValue(meta));
            DEBOUNCE_MAP.delete(key);
        }
    }
}, DEBOUNCE_INTERVAL);

export class ConsoleLogger implements Logger {
    readonly debug: LogFn;
    readonly error: LogFn;
    readonly info: LogFn;
    readonly warn: LogFn;

    constructor(options?: { level?: LogLevel }) {
        const { level } = options || {};

        // Create timestamp wrapper function with colors and debouncing
        const withTimestamp = (logLevel: string): LogFn => {
            return (message?: any, ...meta: any) => {
                const key = JSON.stringify([logLevel, message, meta]);
                const now = Date.now();
                const existing = DEBOUNCE_MAP.get(key);

                if (existing) {
                    existing.count++;
                    existing.lastLog = now;
                } else {
                    DEBOUNCE_MAP.set(key, { count: 1, lastLog: now });
                }
            };
        };

        this.error = withTimestamp('error');

        if (level === 'error') {
            this.warn = NO_OP;
            this.info = NO_OP;
            this.debug = NO_OP;
            return;
        }

        this.warn = withTimestamp('warn');

        if (level === 'warn') {
            this.info = NO_OP;
            this.debug = NO_OP;
            return;
        }

        this.info = withTimestamp('info');

        if (level === 'info') {
            this.debug = NO_OP;
            return;
        }

        this.debug = withTimestamp('debug');
    }
}

export const logger = new ConsoleLogger({ level: LOG_LEVEL });

function getMetaValue(meta: any[] | undefined) {
    if (!meta) {
        return undefined;
    }

    if (meta.length === 1) {
        return meta[0];
    }

    return meta;
}
