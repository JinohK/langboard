import { Box, Button, Collapsible, Flex, IconComponent, Toast, Tooltip } from "@/components/base";
import useChangeCardCheckitemOrder, { IChangeCardCheckitemOrderForm } from "@/controllers/api/card/checkitem/useChangeCardCheckitemOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IRowDragCallback, ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project, ProjectChecklist, ProjectCheckitem } from "@/core/models";
import { BoardCardChecklistProvider } from "@/core/providers/BoardCardChecklistProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCardChecklistAddItem from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistAddItem";
import BoardCardChecklistCheckbox from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistCheckbox";
import BoardCardChecklistMore from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistMore";
import BoardCardChecklistNotify from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistNotify";
import BoardCardCheckitem from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitem";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

export interface IBoardCardChecklistProps {
    checklist: ProjectChecklist.TModel;
    callbacksRef: React.RefObject<Record<string, IRowDragCallback<ProjectCheckitem.TModel>>>;
    checkitemsMap: Record<string, ProjectCheckitem.TModel>;
    isOverlay?: bool;
}

interface IBoardCardChecklistDragData extends ISortableDragData<ProjectChecklist.TModel> {
    type: "Checklist";
}

const BoardCardChecklist = memo(({ checklist, checkitemsMap, callbacksRef, isOverlay }: IBoardCardChecklistProps): JSX.Element => {
    const { projectUID, card, socket, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const isOpenedInBoardCard = checklist.useField("isOpenedInBoardCard");
    const checklistId = `board-checklist-${checklist.uid}`;
    const updater = useReducer((x) => x + 1, 0);
    const [updated] = updater;
    const groupCheckitems = ProjectCheckitem.Model.useModels(
        (model) => {
            if (!checkitemsMap[model.uid]) {
                checkitemsMap[model.uid] = model;
            }
            return model.checklist_uid === checklist.uid;
        },
        [checklist, updated]
    );
    const checkitems = groupCheckitems.sort((a, b) => a.order - b.order);
    const checkitemsUIDs = useMemo(() => checkitems.map((checkitem) => checkitem.uid), [checkitems]);
    const { mutate: changeCheckitemOrderMutate } = useChangeCardCheckitemOrder();
    const { moveToColumn, removeFromColumn, reorderInColumn } = useReorderRow({
        type: "ProjectCardCheckitem",
        topicId: card.uid,
        eventNameParams: { uid: checklist.uid },
        allRowsMap: checkitemsMap,
        rows: checkitems,
        columnKey: "checklist_uid",
        currentColumnId: checklist.uid,
        socket,
        updater,
    });
    const canReorder = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: checklist.uid,
        data: {
            type: "Checklist",
            data: checklist,
        } satisfies IBoardCardChecklistDragData,
        attributes: {
            roleDescription: `Checklist: ${checklist.title}`,
        },
    });

    callbacksRef.current[checklistId] = {
        onDragEnd: (originalCheckitem, index) => {
            const isOrderUpdated = originalCheckitem.checklist_uid !== checklist.uid || originalCheckitem.order !== index;
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
            if (originalCheckitem.checklist_uid !== checklist.uid) {
                form.parent_uid = checklist.uid;
            }

            checkitemsMap[originalCheckitem.uid].order = index;
            checkitemsMap[originalCheckitem.uid].checklist_uid = checklist.uid;

            changeCheckitemOrderMutate(form, {
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        wildcardError: () => {
                            Toast.Add.error(t("errors.Internal server error"));
                            reorderInColumn(originalCheckitem.uid, originalCheckitem.order);

                            checkitemsMap[originalCheckitem.uid].order = originalCheckitem.order;
                            checkitemsMap[originalCheckitem.uid].checklist_uid = originalCheckitem.checklist_uid;
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
                checklist.isOpenedInBoardCard = true;
            }

            const shouldRemove = index === -1;
            if (shouldRemove) {
                removeFromColumn(activeCheckitem.uid);
            } else {
                moveToColumn(activeCheckitem.uid, index, checklist.uid);
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
        <Box id={checklistId} {...props}>
            <Collapsible.Root
                open={isOpenedInBoardCard}
                onOpenChange={(opened) => {
                    checklist.isOpenedInBoardCard = opened;
                }}
            >
                <BoardCardChecklistInner checklist={checklist} attributes={attributes} listeners={listeners} />
                <BoardCardCheckitemList checklist={checklist} checklistId={checklistId} checkitemsUIDs={checkitemsUIDs} checkitems={checkitems} />
            </Collapsible.Root>
        </Box>
    );
});

interface IBaordCardChecklistInnerProps {
    checklist: ProjectChecklist.TModel;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
}

const BoardCardChecklistInner = memo(({ checklist, attributes, listeners }: IBaordCardChecklistInnerProps) => {
    const { hasRoleAction, sharedClassNames } = useBoardCard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [isTitleOpened, setIsTitleOpened] = useState(false);
    const title = checklist.useField("title");
    const isChecked = checklist.useField("is_checked");
    const isOpenedInBoardCard = checklist.useField("isOpenedInBoardCard");
    const canEdit = hasRoleAction(Project.ERoleAction.CARD_UPDATE);

    return (
        <BoardCardChecklistProvider checklist={checklist} isValidating={isValidating} setIsValidating={setIsValidating}>
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
                                <BoardCardChecklistCheckbox key={`board-card-checklist-checkbox-${checklist.uid}`} />
                                <BoardCardChecklistNotify key={`board-card-checklist-notify-${checklist.uid}`} />
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
                            <BoardCardChecklistAddItem key={`board-card-checklist-add-item-${checklist.uid}`} />
                            <BoardCardChecklistMore key={`board-card-checklist-more-${checklist.uid}`} />
                        </>
                    )}
                </Flex>
            </Flex>
        </BoardCardChecklistProvider>
    );
});

interface IBoardCardCheckitemListProps {
    checklist: ProjectChecklist.TModel;
    checklistId: string;
    checkitemsUIDs: string[];
    checkitems: ProjectCheckitem.TModel[];
}

const BoardCardCheckitemList = memo(({ checklist, checklistId, checkitemsUIDs, checkitems }: IBoardCardCheckitemListProps) => {
    return (
        <Collapsible.Content
            className={cn(
                "overflow-hidden text-sm transition-all",
                "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
            )}
        >
            <SortableContext id={checklistId} items={checkitemsUIDs} strategy={verticalListSortingStrategy}>
                {checkitems.map((checkitem) => (
                    <BoardCardCheckitem key={`board-checklist-${checklist.uid}-${checkitem.uid}`} checkitem={checkitem} />
                ))}
            </SortableContext>
        </Collapsible.Content>
    );
});

export default BoardCardChecklist;
