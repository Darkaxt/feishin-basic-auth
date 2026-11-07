interface Rect {
    height: number;
    width: number;
    x: number;
    y: number;
}

export const MINI_QUEUE_HEIGHT = 240;

/** Bounds describe the square surface, independently of its optional queue. */
export const resolveMiniPlayerBounds = (saved: Partial<Rect> | undefined, area: Rect): Rect => {
    const limit = Math.min(600, area.width, area.height);
    const size = Math.round(
        Math.min(
            limit,
            Math.max(Math.min(240, limit), Number.isFinite(saved?.width) ? saved!.width! : 320),
        ),
    );
    const x = Number.isFinite(saved?.x) ? saved!.x! : area.x + area.width - size - 16;
    const y = Number.isFinite(saved?.y) ? saved!.y! : area.y + area.height - size - 16;
    return {
        height: size,
        width: size,
        x: Math.round(Math.max(area.x, Math.min(x, area.x + area.width - size))),
        y: Math.round(Math.max(area.y, Math.min(y, area.y + area.height - size))),
    };
};

export const expandMiniPlayerQueue = (square: Rect, area: Rect, open: boolean): Rect => {
    const height = open ? Math.min(MINI_QUEUE_HEIGHT, area.height - square.height) : 0;
    const bottom = Math.max(square.y + square.height, area.y + square.height + height);
    return { ...square, height: square.height + height, y: bottom - square.height - height };
};
