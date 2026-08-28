import clsx from 'clsx';
import { HTMLMotionProps, motion, useReducedMotion } from 'motion/react';
import { CSSProperties, ReactNode, SyntheticEvent, useState } from 'react';

import styles from './vinyl-artwork.module.css';

import {
    getVinylPresentation,
    isExactVinylArtworkReady,
    isWideVinylArtwork,
    VINYL_GROOVE_COUNT,
    VINYL_GROOVE_END_RADIUS,
    VINYL_GROOVE_START_RADIUS,
    VINYL_LABEL_RADIUS,
    VINYL_ROTATION_DURATION_MS,
    VINYL_SPINDLE_RADIUS,
} from '/@/shared/utils/vinyl-artwork';

const MotionImage = motion.img;

const grooves = Array.from({ length: VINYL_GROOVE_COUNT }, (_, index) => {
    const progress = index / (VINYL_GROOVE_COUNT - 1);
    return (
        VINYL_GROOVE_START_RADIUS + (VINYL_GROOVE_END_RADIUS - VINYL_GROOVE_START_RADIUS) * progress
    );
});

type VinylArtworkProps = {
    className?: string;
    enabled: boolean;
    expectedSrc?: string;
    imageStyle?: CSSProperties;
    isActiveSong: boolean;
    isPlaying: boolean;
    loading?: 'eager' | 'lazy';
    motionProps: HTMLMotionProps<'div'>;
    onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
    placeholder: ReactNode;
    requestKey: string;
    shrinkOnPause: boolean;
    src?: string;
};

export const VinylArtwork = ({
    className,
    enabled,
    expectedSrc,
    imageStyle,
    isActiveSong,
    isPlaying,
    loading,
    motionProps,
    onError,
    placeholder,
    requestKey,
    shrinkOnPause,
    src,
}: VinylArtworkProps) => {
    const reducedMotion = Boolean(useReducedMotion());
    const [loadState, setLoadState] = useState<{
        failedRequestKey: null | string;
        resolvedRequestKey: null | string;
        wide: boolean;
    }>({
        failedRequestKey: null,
        resolvedRequestKey: null,
        wide: false,
    });

    const sourceMatchesRequest = Boolean(src && expectedSrc && src === expectedSrc);
    const artworkReady =
        sourceMatchesRequest &&
        isExactVinylArtworkReady(
            requestKey,
            loadState.resolvedRequestKey,
            loadState.failedRequestKey,
        );
    const failed = loadState.failedRequestKey === requestKey;
    const presentation = getVinylPresentation({
        artworkReady,
        enabled,
        isActiveSong,
        isPlaying,
        reducedMotion,
        shrinkOnPause,
    });

    const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
        if (!sourceMatchesRequest) {
            return;
        }

        const image = event.currentTarget;
        setLoadState({
            failedRequestKey: null,
            resolvedRequestKey: requestKey,
            wide: isWideVinylArtwork(image.naturalWidth, image.naturalHeight),
        });
    };

    const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
        if (sourceMatchesRequest || !enabled) {
            setLoadState({
                failedRequestKey: requestKey,
                resolvedRequestKey: null,
                wide: false,
            });
        }
        onError?.(event);
    };

    if (!src || failed) {
        return <>{placeholder}</>;
    }

    if (!enabled) {
        return (
            <MotionImage
                {...(motionProps as HTMLMotionProps<'img'>)}
                className={className}
                loading={loading}
                onError={handleError}
                onLoad={handleLoad}
                src={src}
                style={imageStyle}
            />
        );
    }

    return (
        <motion.div
            {...motionProps}
            className={clsx(className, styles.root, {
                [styles.ready]: presentation.showRecord,
                [styles.reducedMotion]: reducedMotion,
                [styles.shrunk]: presentation.shrink,
            })}
            style={{ ...motionProps.style, width: '100%' }}
        >
            {!presentation.showRecord && <div className={styles.placeholder}>{placeholder}</div>}
            <div className={styles.surface}>
                <div
                    className={clsx(styles.record, {
                        [styles.rotating]: presentation.rotate,
                    })}
                    style={{
                        animationDuration: `${VINYL_ROTATION_DURATION_MS}ms`,
                    }}
                >
                    <img
                        alt=""
                        className={clsx(styles.artwork, {
                            [styles.wideArtwork]: loadState.wide,
                        })}
                        draggable={false}
                        loading={loading}
                        onError={handleError}
                        onLoad={handleLoad}
                        src={src}
                        style={imageStyle}
                    />
                    <svg
                        aria-hidden="true"
                        className={styles.overlay}
                        focusable="false"
                        viewBox="0 0 200 200"
                    >
                        <circle cx="100" cy="100" fill="black" opacity="0.16" r="98.5" />
                        <circle
                            cx="100"
                            cy="100"
                            fill="none"
                            opacity="0.16"
                            r="99"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        />
                        {grooves.map((radius, index) => (
                            <circle
                                cx="100"
                                cy="100"
                                fill="none"
                                key={radius}
                                opacity={index % 7 === 0 ? 0.22 : 0.13}
                                r={radius * 100}
                                stroke="currentColor"
                                strokeWidth={index % 7 === 0 ? 0.9 : 0.65}
                            />
                        ))}
                        <circle
                            cx="100"
                            cy="100"
                            fill="currentColor"
                            fillOpacity="0.22"
                            r={VINYL_LABEL_RADIUS * 100}
                            stroke="currentColor"
                            strokeOpacity="0.32"
                            strokeWidth="0.8"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            fill="currentColor"
                            fillOpacity="0.92"
                            r={VINYL_SPINDLE_RADIUS * 100}
                            stroke="black"
                            strokeOpacity="0.28"
                            strokeWidth="0.4"
                        />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};
