"use client";

import { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import BoardColumn, { SkeletonBoardColumn } from "@/pages/BoardPage/components/board/BoardColumn";
import { bindAll } from "bind-event-listener";
import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { useBoard } from "@/core/providers/BoardProvider";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { Box, Flex, ScrollArea } from "@/components/base";
import BoardColumnAdd from "@/pages/BoardPage/components/board/BoardColumnAdd";
import useChangeProjectColumnOrder from "@/controllers/api/board/useChangeProjectColumnOrder";
import createBoardEvents from "@/pages/BoardPage/components/board/BoardEvents";
import useChangeCardOrder from "@/controllers/api/board/useChangeCardOrder";
import { BLOCK_BOARD_PANNING_ATTR } from "@/pages/BoardPage/components/board/BoardData";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { SkeletonBoardFilter } from "@/pages/BoardPage/components/board/BoardFilter";
import { createShortUUID } from "@/core/utils/StringUtils";

export function SkeletonBoard() {
    const [cardCounts, setCardCounts] = useState([1, 3, 2]);

    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;

        const updateCardCounts = () => {
            setCardCounts((prev) => {
                return prev.map((count) => {
                    if (count === 1) {
                        count = 3;
                    } else if (count === 3) {
                        count = 2;
                    } else {
                        count = 1;
                    }

                    return count;
                });
            });
        };

        timeout = setTimeout(updateCardCounts, 2000);

        return () => {
            clearTimeout(timeout!);
            timeout = null;
        };
    }, []);

    return (
        <>
            <Flex justify="between" px="4" pt="4" wrap>
                <SkeletonUserAvatarList count={6} size={{ initial: "sm", xs: "default" }} spacing="none" />
                <Flex items="center" gap="1">
                    <SkeletonBoardFilter />
                </Flex>
            </Flex>

            <Box position="relative" h="full" className="max-h-[calc(100vh_-_theme(spacing.28)_-_theme(spacing.2))] overflow-hidden">
                <Box size="full" className="rounded-[inherit]">
                    <Flex direction="row" items="start" gap="10" p="4">
                        {cardCounts.map((count) => (
                            <SkeletonBoardColumn key={createShortUUID()} cardCount={count} />
                        ))}
                    </Flex>
                </Box>
            </Box>
        </>
    );
}

export function Board() {
    const { project, columns: flatColumns, cardsMap, socket, canDragAndDrop } = useBoard();
    const { columns } = useReorderColumn({
        type: "ProjectColumn",
        topicId: project.uid,
        eventNameParams: { uid: project.uid },
        columns: flatColumns,
        socket,
    });
    const scrollableRef = useRef<HTMLDivElement | null>(null);
    const { mutate: changeColumnOrderMutate } = useChangeProjectColumnOrder();
    const { mutate: changeCardOrderMutate } = useChangeCardOrder();

    useEffect(() => {
        const element = scrollableRef.current;
        invariant(element);

        return createBoardEvents({
            project,
            columns,
            cardsMap,
            scrollable: element,
            changeColumnOrderMutate,
            changeCardOrderMutate,
        });
    }, [flatColumns, cardsMap]);

    // Panning the board
    useEffect(() => {
        let cleanupActive: CleanupFn | null = null;
        const scrollable = scrollableRef.current;
        invariant(scrollable);

        function begin({ startX }: { startX: number }) {
            let lastX = startX;

            const cleanupEvents = bindAll(
                window,
                [
                    {
                        type: "pointermove",
                        listener(event) {
                            const currentX = event.clientX;
                            const diffX = lastX - currentX;

                            lastX = currentX;
                            scrollable?.scrollBy({ left: diffX });
                        },
                    },
                    // stop panning if we see any of these events
                    ...(["pointercancel", "pointerup", "pointerdown", "keydown", "resize", "click", "visibilitychange"] as const).map(
                        (eventName) => ({ type: eventName, listener: () => cleanupEvents() })
                    ),
                ],
                // need to make sure we are not after the "pointerdown" on the scrollable
                // Also this is helpful to make sure we always hear about events from this point
                { capture: true }
            );

            cleanupActive = cleanupEvents;
        }

        const cleanupStart = bindAll(scrollable, [
            {
                type: "pointerdown",
                listener(event) {
                    if (!(event.target instanceof HTMLElement)) {
                        return;
                    }
                    // ignore interactive elements
                    if (event.target.closest(`[${BLOCK_BOARD_PANNING_ATTR}]`)) {
                        return;
                    }

                    begin({ startX: event.clientX });
                },
            },
        ]);

        return function cleanupAll() {
            cleanupStart();
            cleanupActive?.();
        };
    }, []);

    return (
        <ScrollArea.Root
            className="h-full max-h-[calc(100vh_-_theme(spacing.28)_-_theme(spacing.2))]"
            viewportClassName="!overflow-y-auto"
            viewportRef={scrollableRef}
        >
            <Flex direction="row" items="start" gap={{ initial: "8", sm: "10" }} p="4" className="w-max">
                {columns.map((column) => (
                    <BoardColumn key={column.uid} column={column} />
                ))}
                {canDragAndDrop && <BoardColumnAdd />}
            </Flex>
            <ScrollArea.Bar orientation="horizontal" />
        </ScrollArea.Root>
    );
}
