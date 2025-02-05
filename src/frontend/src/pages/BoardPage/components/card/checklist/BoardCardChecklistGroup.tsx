import { Box, Button, Collapsible, Flex, Toast } from "@/components/base";
import useChangeCardChecklistOrder from "@/controllers/api/card/checklist/useChangeCardChecklistOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { ProjectChecklist, ProjectCheckitem } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardChecklist from "@/pages/BoardPage/components/card/checklist/BoardCardChecklist";
import BoardCardCheckitem from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitem";
import SkeletonBoardCardCheckitem from "@/pages/BoardPage/components/card/checklist/SkeletonBoardCardCheckitem";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardChecklistGroup() {
    return (
        <>
            <SkeletonBoardCardCheckitem />
            <SkeletonBoardCardCheckitem />
            <SkeletonBoardCardCheckitem />
        </>
    );
}

function BoardCardChecklistGroup(): JSX.Element {
    const [t] = useTranslation();
    const { projectUID, card, socket } = useBoardCard();
    const [isOpened, setIsOpened] = useState(false);
    const flatChecklists = card.useForeignField<ProjectChecklist.TModel>("checklists");
    const { mutate: changeOrderMutate } = useChangeCardChecklistOrder();
    const { columns: checklists, reorder: reorderCheckitems } = useReorderColumn({
        type: "ProjectChecklist",
        eventNameParams: { uid: card.uid },
        topicId: projectUID,
        columns: flatChecklists,
        socket,
    });
    const checklistUIDs = useMemo(() => checklists.map((checklist) => checklist.uid), [checklists]);
    const checkitemsMap = useMemo<Record<string, ProjectCheckitem.TModel>>(() => {
        const map: Record<string, ProjectCheckitem.TModel> = {};
        checklists.forEach((checklist) => {
            checklist.checkitems.forEach((checkitem) => {
                map[checkitem.uid] = checkitem;
            });
        });
        return map;
    }, [checklists]);
    const dndContextId = useId();
    const {
        activeColumn: activeChecklist,
        activeRow: activeCheckitem,
        containerIdRowDragCallbacksRef: callbacksRef,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<ProjectChecklist.TModel, ProjectCheckitem.TModel>({
        columnDragDataType: "Checklist",
        rowDragDataType: "Checkitem",
        columnCallbacks: {
            onDragEnd: (originalChecklist, index) => {
                const originalCheckitemOrder = originalChecklist.order;
                if (!reorderCheckitems(originalChecklist, index)) {
                    return;
                }

                changeOrderMutate(
                    {
                        project_uid: card.project_uid,
                        card_uid: card.uid,
                        checklist_uid: originalChecklist.uid,
                        order: index,
                    },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    reorderCheckitems(originalChecklist, originalCheckitemOrder);
                                },
                            });

                            handle(error);
                        },
                    }
                );
            },
        },
        transformContainerId: (item) => {
            return `board-checklist-${(item as ProjectCheckitem.TModel).checklist_uid ?? item.uid}`;
        },
    });

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOverOrMove}>
            <SortableContext items={checklistUIDs} strategy={verticalListSortingStrategy}>
                {checklists.slice(0, 5).map((checklist) => (
                    <BoardCardChecklist
                        key={`board-checklist-${checklist.uid}`}
                        checklist={checklist}
                        checkitemsMap={checkitemsMap}
                        callbacksRef={callbacksRef}
                    />
                ))}
                {checklists.length > 5 && (
                    <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                        <Collapsible.Content asChild>
                            <Box>
                                {checklists.slice(5).map((checklist) => (
                                    <BoardCardChecklist
                                        key={`board-checklist-${checklist.uid}`}
                                        checklist={checklist}
                                        checkitemsMap={checkitemsMap}
                                        callbacksRef={callbacksRef}
                                    />
                                ))}
                            </Box>
                        </Collapsible.Content>
                        <Collapsible.Trigger asChild>
                            <Flex justify="start" mt="2">
                                <Button size="sm" variant="secondary">
                                    {t(`card.${isOpened ? "Show fewer checklists" : "Show all checklists ({checklists} hidden)"}`, {
                                        checklists: checklists.length - 5,
                                    })}
                                </Button>
                            </Flex>
                        </Collapsible.Trigger>
                    </Collapsible.Root>
                )}
            </SortableContext>

            {!TypeUtils.isUndefined(window) &&
                createPortal(
                    <DragOverlay>
                        {activeChecklist && (
                            <BoardCardChecklist
                                key={`board-checklist-${activeChecklist.uid}`}
                                checklist={activeChecklist}
                                checkitemsMap={checkitemsMap}
                                callbacksRef={callbacksRef}
                                isOverlay
                            />
                        )}
                        {activeCheckitem && <BoardCardCheckitem checkitem={activeCheckitem} isOverlay />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
}

export default BoardCardChecklistGroup;
