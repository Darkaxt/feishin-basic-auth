import type { MiniPlayerState } from '/@/shared/types/mini-player';

import { create } from 'zustand';

// Presentation state is owned by the native window, never persisted as startup mode.
export const useMiniPlayerStore = create<MiniPlayerState>(() => ({
    active: false,
    queueOpen: false,
}));
