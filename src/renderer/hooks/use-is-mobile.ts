import { useMediaQuery } from '@mantine/hooks';

import { useMiniPlayerStore } from '/@/renderer/store/mini-player.store';

export const useIsMobile = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const mini = useMiniPlayerStore((state) => state.active);
    // The media-query notification and native mode IPC can arrive in the same turn.
    // Read the current viewport too, rather than briefly using the old mini width.
    return isMobile && !mini && window.matchMedia('(max-width: 768px)').matches;
};
