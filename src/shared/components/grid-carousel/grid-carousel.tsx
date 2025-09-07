import { AnimatePresence, motion, Variants } from 'motion/react';
import { memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import styles from './grid-carousel.module.css';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { useContainerBreakpoints } from '/@/shared/hooks/use-container-breakpoints';

interface Card {
    content: ReactNode;
    id: string;
}

interface GridCarouselProps {
    cards: Card[];
    loadNextPage?: () => void;
    onNextPage: (page: number) => void;
    onPrevPage: (page: number) => void;
    rowCount?: number;
    title?: string;
}

const MemoizedCard = memo(({ content }: { content: ReactNode }) => (
    <div className={styles.card}>{content}</div>
));

MemoizedCard.displayName = 'MemoizedCard';

const pageVariants: Variants = {
    animate: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' }, x: 0 },
    exit: (custom: { isNext: boolean }) => ({
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeIn' },
        x: custom.isNext ? -100 : 100,
    }),
    initial: (custom: { isNext: boolean }) => ({ opacity: 0, x: custom.isNext ? 100 : -100 }),
};

export function GridCarousel(props: GridCarouselProps) {
    const { cards, loadNextPage, onNextPage, onPrevPage, rowCount = 1, title } = props;
    const { breakpoints, ref: containerRef } = useContainerBreakpoints();

    const [currentPage, setCurrentPage] = useState({
        isNext: false,
        page: 0,
    });

    const handlePrevPage = useCallback(() => {
        setCurrentPage((prev) => ({
            isNext: false,
            page: prev.page > 0 ? prev.page - 1 : 0,
        }));
        onPrevPage(currentPage.page);
    }, [currentPage, onPrevPage]);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => ({
            isNext: true,
            page: prev.page + 1,
        }));
        onNextPage(currentPage.page);
    }, [currentPage, onNextPage]);

    const cardsToShow = getCardsToShow(breakpoints);

    const visibleCards = useMemo(() => {
        return cards.slice(
            currentPage.page * cardsToShow * rowCount,
            (currentPage.page + 1) * cardsToShow * rowCount,
        );
    }, [cards, currentPage, cardsToShow, rowCount]);

    const shouldLoadNextPage = visibleCards.length < cardsToShow * rowCount;

    useEffect(() => {
        if (shouldLoadNextPage) {
            loadNextPage?.();
        }
    }, [loadNextPage, shouldLoadNextPage]);

    const isPrevDisabled = currentPage.page === 0;
    const isNextDisabled = visibleCards.length < cardsToShow * rowCount;

    return (
        <motion.div className={styles.gridCarousel} ref={containerRef}>
            <div className={styles.navigation}>
                <TextTitle order={1}>{title}</TextTitle>
                <Group gap="xs" justify="end">
                    <ActionIcon
                        disabled={isPrevDisabled}
                        icon="arrowLeftS"
                        onClick={handlePrevPage}
                        size="xs"
                        variant="default"
                    />
                    <ActionIcon
                        disabled={isNextDisabled}
                        icon="arrowRightS"
                        onClick={handleNextPage}
                        size="xs"
                        variant="default"
                    />
                </Group>
            </div>
            <AnimatePresence custom={currentPage} initial={false} mode="wait">
                <motion.div
                    animate="animate"
                    className={styles.grid}
                    custom={currentPage}
                    exit="exit"
                    initial="initial"
                    key={currentPage.page}
                    style={{ '--row-count': rowCount } as React.CSSProperties}
                    variants={pageVariants}
                >
                    {visibleCards.map((card) => (
                        <MemoizedCard content={card.content} key={card.id} />
                    ))}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

function getCardsToShow(breakpoints: {
    isLargerThan2xl: boolean;
    isLargerThan3xl: boolean;
    isLargerThanLg: boolean;
    isLargerThanMd: boolean;
    isLargerThanSm: boolean;
    isLargerThanXl: boolean;
}) {
    if (breakpoints.isLargerThan3xl) {
        return 10;
    }

    if (breakpoints.isLargerThan2xl) {
        return 8;
    }

    if (breakpoints.isLargerThanXl) {
        return 7;
    }

    if (breakpoints.isLargerThanLg) {
        return 6;
    }

    if (breakpoints.isLargerThanMd) {
        return 5;
    }

    if (breakpoints.isLargerThanSm) {
        return 4;
    }

    return 2;
}
