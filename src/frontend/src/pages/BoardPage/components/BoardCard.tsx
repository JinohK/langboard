import { Button, Card, Collapsible, Flex, HoverCard, IconComponent, ScrollArea, Skeleton } from "@/components/base";
import Markdown from "@/components/Markdown";
import UserAvatarList from "@/components/UserAvatarList";
import { IBoardTask } from "@/controllers/board/useGetTasks";
import { IBoardProject } from "@/controllers/board/useProjectAvailable";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { StringCase } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { IFilterMap, navigateFilters } from "@/pages/BoardPage/components/boardFilterUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { tv } from "tailwind-variants";

export interface IBoardCardProps {
    project: IBoardProject;
    task: IBoardTask & {
        isOpenedRef?: React.MutableRefObject<bool>;
    };
    filters: IFilterMap;
    closeHoverCardRef?: React.MutableRefObject<(() => void) | undefined>;
    isOverlay?: bool;
}

export interface IBoardCardDragData {
    type: "Task";
    task: IBoardCardProps["task"];
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
                <Flex className="rtl:space-x-reverse">
                    <Skeleton className="inline-block size-8 rounded-full" />
                    <Skeleton className="inline-block size-8 rounded-full" />
                </Flex>
            </Card.Footer>
        </Card.Root>
    );
});

const BoardCard = memo(({ project, task, filters, closeHoverCardRef, isOverlay }: IBoardCardProps) => {
    if (TypeUtils.isNullOrUndefined(task.isOpenedRef)) {
        task.isOpenedRef = useRef(false);
    }
    const disabledDraggingAttr = "data-drag-disabled";
    const [isHoverCardOpened, setIsHoverCardOpened] = useState(false);
    const [isHoverCardHidden, setIsHoverCardHidden] = useState(false);
    const { hasRoleAction } = useRoleActionFilter<Project.TProjectRoleActions>(project.current_user_role_actions);
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.uid,
        data: {
            type: "Task",
            task,
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

    let cardInner = (
        <BoardCardInner
            filters={filters}
            disabledDraggingAttr={disabledDraggingAttr}
            isOpenedRef={task.isOpenedRef}
            uid={task.uid}
            title={task.title}
            commentCount={task.comment_count}
            members={task.members}
            relationships={task.relationships}
            setIsHoverCardHidden={setIsHoverCardHidden}
        />
    );

    if (!isOverlay && !isDragging && task.description.length > 0) {
        cardInner = (
            <HoverCard.Root
                open={isHoverCardOpened}
                onOpenChange={(opened) => {
                    setIsHoverCardOpened(opened);
                    if (closeHoverCardRef) {
                        closeHoverCardRef.current = opened ? () => setIsHoverCardOpened(false) : undefined;
                    }
                }}
            >
                <HoverCard.Trigger asChild>
                    <div>{cardInner}</div>
                </HoverCard.Trigger>
                <HoverCard.Content
                    side="right"
                    align="end"
                    className="max-xs:max-w-screen w-64 cursor-auto p-0"
                    {...{ [disabledDraggingAttr]: "" }}
                    hidden={isHoverCardHidden}
                >
                    <ScrollArea.Root>
                        <div className="max-h-[calc(100vh-_theme(spacing.4))] break-all p-4 [&_img]:max-w-full">
                            <Markdown>{task.description}</Markdown>
                        </div>
                    </ScrollArea.Root>
                </HoverCard.Content>
            </HoverCard.Root>
        );
    }

    return <div {...props}>{cardInner}</div>;
});

interface IBoardCardInnerProps extends Omit<IBoardTask, "column_uid" | "description" | "comment_count" | "order"> {
    commentCount: IBoardTask["comment_count"];
    disabledDraggingAttr: string;
    isOpenedRef: React.MutableRefObject<bool>;
    filters: IFilterMap;
    setIsHoverCardHidden: React.Dispatch<React.SetStateAction<bool>>;
}

const BoardCardInner = memo(
    ({
        filters,
        uid,
        title,
        commentCount,
        members,
        relationships,
        disabledDraggingAttr,
        isOpenedRef,
        setIsHoverCardHidden,
    }: IBoardCardInnerProps) => {
        const [t] = useTranslation();
        const [isOpened, setIsOpened] = useState(isOpenedRef.current);
        const navigate = useNavigate();
        const attributes = {
            [disabledDraggingAttr]: "",
            onPointerEnter: (e: React.PointerEvent) => {
                const target = e.target as HTMLElement;
                if (target.closest(`[${disabledDraggingAttr}]`)) {
                    setIsHoverCardHidden(true);
                }
            },
        };

        const openCard = () => {
            // TODO: Task, open card
        };

        const setFilters = (relationshipType: keyof IBoardTask["relationships"]) => {
            if (!filters[relationshipType]) {
                filters[relationshipType] = [];
            }

            if (filters[relationshipType].includes(uid)) {
                filters[relationshipType] = filters[relationshipType].filter((id) => id !== uid);
            } else {
                filters[relationshipType].push(uid);
            }

            navigateFilters(navigate, filters);
        };

        return (
            <Card.Root
                className="relative cursor-pointer"
                onPointerOut={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest(`[${disabledDraggingAttr}]`)) {
                        setIsHoverCardHidden(false);
                    }
                }}
            >
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
                        <Collapsible.Trigger asChild>
                            <Button
                                variant="ghost"
                                className="absolute right-2.5 top-1 mt-0 transition-all [&[data-state=open]>svg]:rotate-180"
                                size="icon-sm"
                                title={t(`board.${isOpened ? "Collapse" : "Expand"}`)}
                                titleSide="bottom"
                                {...attributes}
                            >
                                <IconComponent icon="chevron-down" size="4" />
                            </Button>
                        </Collapsible.Trigger>
                    </Card.Header>
                    <Collapsible.Content
                        className={cn(
                            "overflow-hidden text-sm transition-all",
                            "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
                        )}
                    >
                        <Card.Content>
                            {(["parents", "children"] as (keyof IBoardTask["relationships"])[]).map((relationshipType) => {
                                const relationship = relationships[relationshipType];
                                if (!relationship.length) {
                                    return null;
                                }

                                return (
                                    <Button
                                        key={`board-card-relationship-button-${relationshipType}-${uid}`}
                                        size="icon-sm"
                                        className={cn(
                                            "absolute top-1/2 z-20 block -translate-y-1/2 transform rounded-full text-xs",
                                            relationshipType === "parents" ? "-left-3" : "-right-3"
                                        )}
                                        title={t(`project.${new StringCase(relationshipType).toPascal()}`)}
                                        titleSide={relationshipType === "parents" ? "right" : "left"}
                                        onClick={() => setFilters(relationshipType)}
                                        {...attributes}
                                    >
                                        +{relationship.length}
                                    </Button>
                                );
                            })}
                        </Card.Content>
                        <Card.Footer className="flex items-end justify-between gap-1.5 pb-4">
                            <Flex items="center" gap="2">
                                <IconComponent icon="message-square" size="4" className="text-secondary" strokeWidth="4" />
                                <span>{commentCount}</span>
                            </Flex>
                            <UserAvatarList maxVisible={3} users={members} size="sm" {...attributes} className="cursor-default" />
                        </Card.Footer>
                    </Collapsible.Content>
                </Collapsible.Root>
            </Card.Root>
        );
    }
);

export default BoardCard;
