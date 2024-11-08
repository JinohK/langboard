import { Button, Card, Collapsible, IconComponent, Skeleton, Tooltip } from "@/components/base";
import UserAvatarList from "@/components/UserAvatarList";
import { IBoardTask } from "@/controllers/board/useGetColumnTasks";
import { IProjectAvailableResponse } from "@/controllers/board/useProjectAvailable";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

export interface IBoardCardProps {
    project: IProjectAvailableResponse["project"];
    task: IBoardTask;
    isOverlay?: bool;
    isOpened?: bool;
}

export interface IBoardCardDragData {
    type: "Task";
    task: IBoardTask;
    isOpenedRef: React.MutableRefObject<bool>;
}

export const SkeletonBoardCard = memo(() => {
    return (
        <Card.Root className="border-transparent shadow-transparent">
            <Card.Header className="relative block py-4">
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">
                    <Skeleton className="inline-block h-4 w-3/4" />
                </Card.Title>
                <Skeleton className="absolute right-2.5 top-1 mt-0 inline-block size-8 rounded-md" />
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-end justify-between gap-1.5 pb-4">
                <Skeleton className="inline-block h-3.5 w-6" />
                <div className="flex rtl:space-x-reverse">
                    <Skeleton className="inline-block size-8 rounded-full" />
                    <Skeleton className="inline-block size-8 rounded-full" />
                </div>
            </Card.Footer>
        </Card.Root>
    );
});

interface IBoardCardInnerProps extends IBoardTask {
    disabledDraggingAttr: string;
    isOpenedRef: React.MutableRefObject<bool>;
}

const BoardCardInner = memo(({ title, comment_count, members, disabledDraggingAttr, isOpenedRef }: IBoardCardInnerProps) => {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(isOpenedRef.current);
    const attributes = {
        [disabledDraggingAttr]: "",
    };

    const openCard = () => {
        // TODO: Task, open card
    };

    return (
        <Card.Root className="cursor-pointer">
            <Collapsible.Root
                open={isOpened}
                onOpenChange={(opened) => {
                    setIsOpened(opened);
                    isOpenedRef.current = opened;
                }}
            >
                <Card.Header className="relative block py-4">
                    <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight" onClick={openCard}>
                        {title}
                    </Card.Title>
                    <Tooltip.Provider delayDuration={400} key={createShortUUID()}>
                        <Tooltip.Root>
                            <Collapsible.Trigger asChild>
                                <Tooltip.Trigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="absolute right-2.5 top-1 mt-0 transition-all [&[data-state=open]>svg]:rotate-180"
                                        size="icon-sm"
                                        {...attributes}
                                    >
                                        <IconComponent icon="chevron-down" size="4" />
                                    </Button>
                                </Tooltip.Trigger>
                            </Collapsible.Trigger>
                            <Tooltip.Content side="bottom">{t(`board.${isOpened ? "Collapse" : "Expand"}`)}</Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                </Card.Header>
                <Collapsible.Content
                    className={cn(
                        "overflow-hidden text-sm transition-all",
                        "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
                    )}
                >
                    <Card.Content></Card.Content>
                    <Card.Footer className="flex items-end justify-between gap-1.5 pb-4">
                        <div className="flex items-center gap-2">
                            <IconComponent icon="message-square" size="4" className="text-secondary" strokeWidth="4" />
                            <span>{comment_count}</span>
                        </div>
                        <UserAvatarList maxVisible={3} users={members} size="sm" {...attributes} className="cursor-default" />
                    </Card.Footer>
                </Collapsible.Content>
            </Collapsible.Root>
        </Card.Root>
    );
});

const BoardCard = memo(({ project, task, isOverlay, isOpened = false }: IBoardCardProps) => {
    const disabledDraggingAttr = "data-drag-disabled";
    const isOpenedRef = useRef(isOpened);
    const { hasRoleAction } = useRoleActionFilter<Project.TProjectRoleActions>(project.current_user_role_actions);
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.uid,
        data: {
            type: "Task",
            task,
            isOpenedRef,
        } satisfies IBoardCardDragData,
        attributes: {
            roleDescription: "Task",
        },
    });
    const onMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if ((e.target as HTMLElement)?.closest?.(`[${disabledDraggingAttr}]`)) {
            return;
        }

        listeners?.onMouseDown?.(e);
    }, []);
    const onTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
        if ((e.target as HTMLElement)?.closest?.(`[${disabledDraggingAttr}]`)) {
            return;
        }

        listeners?.onTouchStart?.(e);
    }, []);
    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        if ((e.target as HTMLElement)?.closest?.(`[${disabledDraggingAttr}]`)) {
            return;
        }

        listeners?.onKeyDown?.(e);
    }, []);

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "cursor-pointer hover:ring-2 ring-primary",
        variants: {
            dragging: {
                over: "ring-2 opacity-30",
                overlay: "ring-2 ring-primary",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (hasRoleAction("task_update")) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            onMouseDown,
            onTouchStart,
            onKeyDown,
            ...attributes,
            ref: setNodeRef,
        };
    } else {
        props = {
            className: "cursor-pointer",
        };
    }

    return (
        <div {...props}>
            <BoardCardInner disabledDraggingAttr={disabledDraggingAttr} isOpenedRef={isOpenedRef} {...task} />
        </div>
    );
});

export default BoardCard;
