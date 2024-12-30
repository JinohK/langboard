import { Button, Collapsible, Flex, Toast } from "@/components/base";
import useChangeCheckitemOrder from "@/controllers/api/card/checkitem/useChangeCheckitemOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { ProjectCheckitem } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardCheckitem from "@/pages/BoardPage/components/card/checkitem/BoardCardCheckitem";
import BoardCardSubCheckitem from "@/pages/BoardPage/components/card/checkitem/BoardCardSubCheckitem";
import SkeletonBoardCardCheckitem from "@/pages/BoardPage/components/card/checkitem/SkeletonBoardCardCheckitem";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardChecklist() {
    return (
        <>
            <SkeletonBoardCardCheckitem />
            <SkeletonBoardCardCheckitem />
            <SkeletonBoardCardCheckitem />
        </>
    );
}

function BoardCardChecklist(): JSX.Element {
    const [t] = useTranslation();
    const { projectUID, card, socket } = useBoardCard();
    const [isOpened, setIsOpened] = useState(false);
    const { mutate: changeCheckitemOrderMutate } = useChangeCheckitemOrder();
    const flatCheckitems = card.useForeignField<ProjectCheckitem.TModel>("checkitems");
    const { columns: checkitems, reorder: reorderCheckitems } = useReorderColumn({
        type: "ProjectCheckitem",
        eventNameParams: { uid: card.uid },
        topicId: projectUID,
        columns: flatCheckitems,
        socket,
    });
    const checkitemUIDs = useMemo(() => checkitems.map((checkitem) => checkitem.uid), [checkitems]);
    const subCheckitemsMap = useMemo<Record<string, ProjectCheckitem.TModel>>(() => {
        const map: Record<string, ProjectCheckitem.TModel> = {};
        checkitems.forEach((checkitem) => {
            checkitem.sub_checkitems.forEach((subCheckitem) => {
                map[subCheckitem.uid] = subCheckitem;
            });
        });
        return map;
    }, [checkitems]);
    const dndContextId = useId();
    const {
        activeColumn: activeCheckitem,
        activeRow: activeSubCheckitem,
        containerIdRowDragCallbacksRef: callbacksRef,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<ProjectCheckitem.TModel, ProjectCheckitem.TModel>({
        columnDragDataType: "Checkitem",
        rowDragDataType: "SubCheckitem",
        columnCallbacks: {
            onDragEnd: (originalCheckitem, index) => {
                const originalCheckitemOrder = originalCheckitem.order;
                if (!reorderCheckitems(originalCheckitem, index)) {
                    return;
                }

                changeCheckitemOrderMutate(
                    { project_uid: projectUID, card_uid: card.uid, checkitem_uid: originalCheckitem.uid, order: index },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    reorderCheckitems(originalCheckitem, originalCheckitemOrder);
                                },
                            });

                            handle(error);
                        },
                    }
                );
            },
        },
        transformContainerId: (checkitem) => {
            return `board-checkitem-${(checkitem as ProjectCheckitem.TModel).checkitem_uid ?? checkitem.uid}`;
        },
    });

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOverOrMove}>
            <SortableContext items={checkitemUIDs} strategy={verticalListSortingStrategy}>
                {checkitems.slice(0, 5).map((checkitem) => (
                    <BoardCardCheckitem
                        key={`board-checkitem-${checkitem.uid}`}
                        checkitem={checkitem}
                        subCheckitemsMap={subCheckitemsMap}
                        callbacksRef={callbacksRef}
                    />
                ))}
                {checkitems.length > 5 && (
                    <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                        <Collapsible.Content asChild>
                            <>
                                {checkitems.slice(5).map((checkitem) => (
                                    <BoardCardCheckitem
                                        key={`board-checkitem-${checkitem.uid}`}
                                        checkitem={checkitem}
                                        subCheckitemsMap={subCheckitemsMap}
                                        callbacksRef={callbacksRef}
                                    />
                                ))}
                            </>
                        </Collapsible.Content>
                        <Collapsible.Trigger asChild>
                            <Flex justify="start" mt="2">
                                <Button size="sm" variant="secondary">
                                    {t(`card.${isOpened ? "Show fewer checklist" : "Show all checklist ({checkitems} hidden)"}`, {
                                        checkitems: checkitems.length - 5,
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
                        {activeCheckitem && (
                            <BoardCardCheckitem
                                key={`board-checkitem-${activeCheckitem.uid}`}
                                checkitem={activeCheckitem}
                                subCheckitemsMap={subCheckitemsMap}
                                callbacksRef={callbacksRef}
                                isOverlay
                            />
                        )}
                        {activeSubCheckitem && <BoardCardSubCheckitem checkitem={activeSubCheckitem} isOverlay />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
}

export default BoardCardChecklist;
