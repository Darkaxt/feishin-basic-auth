export interface MpvQueuePlan {
    currentUrl: string;
    nextUrl?: string;
    pause: boolean;
    startTime?: number;
}

export interface MpvQueuePlanInput {
    currentUrl?: string;
    isPlaying: boolean;
    nextUrl?: string;
    startTime?: number;
}

type QueueSync = () => Promise<boolean>;

export const createMpvQueuePlan = (input: MpvQueuePlanInput): MpvQueuePlan | undefined => {
    if (!input.currentUrl) {
        return undefined;
    }

    return {
        currentUrl: input.currentUrl,
        nextUrl: input.nextUrl,
        pause: !input.isPlaying,
        startTime: input.startTime,
    };
};

export const createMpvQueueSyncCoordinator = () => {
    let isReady = false;
    let pendingSync: QueueSync | undefined;
    let syncChain = Promise.resolve(false);

    const run = (sync: QueueSync) => {
        syncChain = syncChain.then(sync, sync);
        return syncChain;
    };

    return {
        markReady(syncLatest: QueueSync) {
            isReady = true;
            const sync = pendingSync ?? syncLatest;
            pendingSync = undefined;
            return run(sync);
        },
        request(sync: QueueSync) {
            if (!isReady) {
                pendingSync = sync;
                return Promise.resolve(false);
            }

            return run(sync);
        },
        reset() {
            isReady = false;
            pendingSync = undefined;
        },
    };
};
