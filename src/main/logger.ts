const pad = (n: number) => String(n).padStart(2, '0');

const timestamp = () => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const format = (level: string, message: string, ...args: unknown[]) => {
    const prefix = `[${timestamp()}] [${level}] ${message}`;
    if (args.length > 0) {
        console.log(prefix, ...args);
    } else {
        console.log(prefix);
    }
};

export const mainLogger = {
    debug: (message: string, ...args: unknown[]) => format('DEBUG', message, ...args),
    error: (message: string, ...args: unknown[]) => {
        const prefix = `[${timestamp()}] [ERROR] ${message}`;
        if (args.length > 0) {
            console.error(prefix, ...args);
        } else {
            console.error(prefix);
        }
    },
    info: (message: string, ...args: unknown[]) => format('INFO', message, ...args),
    warn: (message: string, ...args: unknown[]) => {
        const prefix = `[${timestamp()}] [WARN] ${message}`;
        if (args.length > 0) {
            console.warn(prefix, ...args);
        } else {
            console.warn(prefix);
        }
    },
};
