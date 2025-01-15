import { Box, Button, Collapsible, Flex, IconComponent, Toast, Tooltip } from "@/components/base";
import useChangeCardCheckitemOrder, { IChangeCardCheckitemOrderForm } from "@/controllers/api/card/checkitem/useChangeCardCheckitemOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IRowDragCallback, ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project, ProjectCheckGroup, ProjectCheckitem } from "@/core/models";
import { BoardCardCheckGroupProvider } from "@/core/providers/BoardCardCheckGroupProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCardCheckGroupAddItem from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckGroupAddItem";
import BoardCardCheckGroupCheckbox from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckGroupCheckbox";
import BoardCardCheckGroupMore from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckGroupMore";
import BoardCardCheckGroupNotify from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckGroupNotify";
import BoardCardCheckitem from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckitem";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

export interface IBoardCardCheckGroupProps {
    checkGroup: ProjectCheckGroup.TModel;
    callbacksRef: React.RefObject<Record<string, IRowDragCallback<ProjectCheckitem.TModel>>>;
    checkitemsMap: Record<string, ProjectCheckitem.TModel>;
    isOverlay?: bool;
}

interface IBoardCardCheckGroupDragData extends ISortableDragData<ProjectCheckGroup.TModel> {
    type: "CheckGroup";
}

const BoardCardCheckGroup = memo(({ checkGroup, checkitemsMap, callbacksRef, isOverlay }: IBoardCardCheckGroupProps): JSX.Element => {
    const { projectUID, card, socket, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const isOpenedInBoardCard = checkGroup.useField("isOpenedInBoardCard");
    const checkGroupId = `board-check-group-${checkGroup.uid}`;
    const updater = useReducer((x) => x + 1, 0);
    const [updated] = updater;
    const groupCheckitems = ProjectCheckitem.Model.useModels(
        (model) => {
            if (!checkitemsMap[model.uid]) {
                checkitemsMap[model.uid] = model;
            }
            return model.check_group_uid === checkGroup.uid;
        },
        [checkGroup, updated]
    );
    const checkitems = groupCheckitems.sort((a, b) => a.order - b.order);
    const checkitemsUIDs = useMemo(() => checkitems.map((checkitem) => checkitem.uid), [checkitems]);
    const { mutate: changeCheckitemOrderMutate } = useChangeCardCheckitemOrder();
    const { moveToColumn, removeFromColumn, reorderInColumn } = useReorderRow({
        type: "ProjectCardCheckitem",
        topicId: card.uid,
        eventNameParams: { uid: checkGroup.uid },
        allRowsMap: checkitemsMap,
        rows: checkitems,
        columnKey: "check_group_uid",
        currentColumnId: checkGroup.uid,
        socket,
        updater,
    });
    const canReorder = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: checkGroup.uid,
        data: {
            type: "CheckGroup",
            data: checkGroup,
        } satisfies IBoardCardCheckGroupDragData,
        attributes: {
            roleDescription: `CheckGroup: ${checkGroup.title}`,
        },
    });

    callbacksRef.current[checkGroupId] = {
        onDragEnd: (originalCheckitem, index) => {
            const isOrderUpdated = originalCheckitem.check_group_uid !== checkGroup.uid || originalCheckitem.order !== index;
            reorderInColumn(originalCheckitem.uid, index);
            if (!isOrderUpdated) {
                return;
            }

            const form: IChangeCardCheckitemOrderForm = {
                project_uid: projectUID,
                card_uid: card.uid,
                checkitem_uid: originalCheckitem.uid,
                order: index,
            };
            if (originalCheckitem.check_group_uid !== checkGroup.uid) {
                form.parent_uid = checkGroup.uid;
            }

            checkitemsMap[originalCheckitem.uid].order = index;
            checkitemsMap[originalCheckitem.uid].check_group_uid = checkGroup.uid;

            changeCheckitemOrderMutate(form, {
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        wildcardError: () => {
                            Toast.Add.error(t("errors.Internal server error"));
                            reorderInColumn(originalCheckitem.uid, originalCheckitem.order);

                            checkitemsMap[originalCheckitem.uid].order = originalCheckitem.order;
                            checkitemsMap[originalCheckitem.uid].check_group_uid = originalCheckitem.check_group_uid;
                        },
                    });

                    handle(error);
                },
            });
        },
        onDragOverOrMove: (activeCheckitem, index, isForeign) => {
            if (!isForeign) {
                return;
            }

            if (!isOpenedInBoardCard) {
                checkGroup.isOpenedInBoardCard = true;
            }

            const shouldRemove = index === -1;
            if (shouldRemove) {
                removeFromColumn(activeCheckitem.uid);
            } else {
                moveToColumn(activeCheckitem.uid, index, checkGroup.uid);
            }
        },
    };

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "my-2 snap-center",
        variants: {
            dragging: {
                default: "border-2 border-transparent",
                over: "border-b-2 border-primary/50 opacity-30",
                overlay: "",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (canReorder) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            ref: setNodeRef,
        };
    } else {
        props = {
            className: variants(),
        };
    }

    return (
        <Box id={checkGroupId} {...props}>
            <Collapsible.Root
                open={isOpenedInBoardCard}
                onOpenChange={(opened) => {
                    checkGroup.isOpenedInBoardCard = opened;
                }}
            >
                <BoardCardCheckGroupInner checkGroup={checkGroup} attributes={attributes} listeners={listeners} />
                <BoardCardCheckitemList checkGroup={checkGroup} checkGroupId={checkGroupId} checkitemsUIDs={checkitemsUIDs} checkitems={checkitems} />
            </Collapsible.Root>
        </Box>
    );
});

interface IBaordCardCheckGroupInnerProps {
    checkGroup: ProjectCheckGroup.TModel;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
}

const BoardCardCheckGroupInner = memo(({ checkGroup, attributes, listeners }: IBaordCardCheckGroupInnerProps) => {
    const { hasRoleAction, sharedClassNames } = useBoardCard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [isTitleOpened, setIsTitleOpened] = useState(false);
    const title = checkGroup.useField("title");
    const isChecked = checkGroup.useField("is_checked");
    const isOpenedInBoardCard = checkGroup.useField("isOpenedInBoardCard");
    const canEdit = hasRoleAction(Project.ERoleAction.CARD_UPDATE);

    return (
        <BoardCardCheckGroupProvider checkGroup={checkGroup} isValidating={isValidating} setIsValidating={setIsValidating}>
            <Flex
                items="center"
                justify="between"
                gap="2"
                h={{
                    initial: "16",
                    md: "12",
                }}
                className="w-full truncate"
            >
                <Flex items="center" gap="2" w="full" className="truncate">
                    <Flex items="center" gap="1">
                        {canEdit && (
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-8 w-5 sm:size-8"
                                    title={t("common.Drag to reorder")}
                                    disabled={isValidating}
                                    {...attributes}
                                    {...listeners}
                                >
                                    <IconComponent icon="grip-vertical" size="4" />
                                </Button>
                                <BoardCardCheckGroupCheckbox key={`board-card-check-group-checkbox-${checkGroup.uid}`} />
                                <BoardCardCheckGroupNotify key={`board-card-check-group-notify-${checkGroup.uid}`} />
                            </>
                        )}
                        <Collapsible.Trigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-6 transition-all sm:size-8 [&[data-state=open]>svg]:rotate-180"
                                title={t(`common.${isOpenedInBoardCard ? "Collapse" : "Expand"}`)}
                            >
                                <IconComponent icon="chevron-down" size="4" />
                            </Button>
                        </Collapsible.Trigger>
                    </Flex>
                    <Flex
                        direction={{
                            initial: "col",
                            md: "row",
                        }}
                        items={{
                            md: "center",
                        }}
                        gap="0.5"
                        w="full"
                        className="truncate"
                    >
                        <Tooltip.Provider delayDuration={Tooltip.DEFAULT_DURATION}>
                            <Tooltip.Root open={isTitleOpened} onOpenChange={setIsTitleOpened}>
                                <Tooltip.Trigger asChild onClick={() => setIsTitleOpened(!isTitleOpened)}>
                                    <span className={cn("truncate", isChecked && "text-muted-foreground/70 line-through")}>{title}</span>
                                </Tooltip.Trigger>
                                <Tooltip.Content className={sharedClassNames.popoverContent}>{title}</Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    </Flex>
                </Flex>
                <Flex items="center" gap="1.5">
                    {canEdit && (
                        <>
                            <BoardCardCheckGroupAddItem key={`board-card-check-group-add-item-${checkGroup.uid}`} />
                            <BoardCardCheckGroupMore key={`board-card-check-group-more-${checkGroup.uid}`} />
                        </>
                    )}
                </Flex>
            </Flex>
        </BoardCardCheckGroupProvider>
    );
});

interface IBoardCardCheckitemListProps {
    checkGroup: ProjectCheckGroup.TModel;
    checkGroupId: string;
    checkitemsUIDs: string[];
    checkitems: ProjectCheckitem.TModel[];
}

const BoardCardCheckitemList = memo(({ checkGroup, checkGroupId, checkitemsUIDs, checkitems }: IBoardCardCheckitemListProps) => {
    return (
        <Collapsible.Content
            className={cn(
                "overflow-hidden text-sm transition-all",
                "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
            )}
        >
            <SortableContext id={checkGroupId} items={checkitemsUIDs} strategy={verticalListSortingStrategy}>
                {checkitems.map((checkitem) => (
                    <BoardCardCheckitem key={`board-check-group-${checkGroup.uid}-${checkitem.uid}`} checkitem={checkitem} />
                ))}
            </SortableContext>
        </Collapsible.Content>
    );
});

export default BoardCardCheckGroup;
