import { IBoardCardCheckitem, IBoardCardSubCheckitem } from "@/controllers/board/useGetCardDetails";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import BoardCardCheckitem from "@/pages/BoardPage/components/card/BoardCardCheckitem";
import BoardCardSubCheckitem from "@/pages/BoardPage/components/card/BoardCardSubCheckitem";
import { IBaseCardRelatedComponentProps } from "@/pages/BoardPage/components/card/types";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export interface IBoardCardChecklistProps extends IBaseCardRelatedComponentProps {}

function BoardCardChecklist({ projectUID, card, currentUser, currentUserRoleActions, socket }: IBoardCardChecklistProps): JSX.Element {
    const [checkitems, setCheckitems] = useState<IBoardCardCheckitem[]>(card.checkitems);
    const checkitemUIDs = useMemo(() => checkitems.map((checkitem) => checkitem.uid), [checkitems]);
    const subCheckitemsMap = useMemo<Record<string, IBoardCardSubCheckitem>>(() => {
        const map: Record<string, IBoardCardSubCheckitem> = {};
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
        onDragOver,
    } = useColumnRowSortable<IBoardCardCheckitem, IBoardCardSubCheckitem>({
        columnDragDataType: "Checkitem",
        rowDragDataType: "SubCheckitem",
        columnCallbacks: {
            onDragEnd: (originalColumn, index) => {
                setCheckitems((prev) => arrayMove(prev, originalColumn.order, index).map((checkitem, i) => ({ ...checkitem, order: i })));
            },
        },
        transformContainerId: (originalSubCheckitem) => `board-checkitem-${originalSubCheckitem.checkitem_uid}`,
    });
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
            <SortableContext items={checkitemUIDs} strategy={verticalListSortingStrategy}>
                {checkitems.map((checkitem) => (
                    <BoardCardCheckitem
                        checkitem={checkitem}
                        subCheckitemsMap={subCheckitemsMap}
                        key={`board-checkitem-${checkitem.uid}`}
                        orderable={hasRoleAction(Project.ERoleAction.CARD_DELETE)}
                    />
                ))}
            </SortableContext>

            {typeof window !== "undefined" &&
                createPortal(
                    <DragOverlay>
                        {activeCheckitem && (
                            <BoardCardCheckitem
                                checkitem={activeCheckitem}
                                subCheckitemsMap={subCheckitemsMap}
                                key={`board-checkitem-${activeCheckitem.uid}`}
                                isOverlay
                                orderable
                            />
                        )}
                        {activeSubCheckitem && <BoardCardSubCheckitem checkitem={activeSubCheckitem} isOverlay orderable />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
}

export default BoardCardChecklist;
