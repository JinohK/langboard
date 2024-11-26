import { Button, Collapsible, Flex } from "@/components/base";
import { IBoardCardCheckitem, IBoardCardSubCheckitem } from "@/controllers/board/useGetCardDetails";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardCheckitem from "@/pages/BoardPage/components/card/BoardCardCheckitem";
import BoardCardSubCheckitem from "@/pages/BoardPage/components/card/BoardCardSubCheckitem";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

function BoardCardChecklist(): JSX.Element {
    const [t] = useTranslation();
    const { card, currentUserRoleActions } = useBoardCard();
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
    const [isOpened, setIsOpened] = useState(false);

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
            <SortableContext items={checkitemUIDs} strategy={verticalListSortingStrategy}>
                {checkitems.slice(0, 5).map((checkitem) => (
                    <BoardCardCheckitem
                        checkitem={checkitem}
                        subCheckitemsMap={subCheckitemsMap}
                        key={`board-checkitem-${checkitem.uid}`}
                        orderable={hasRoleAction(Project.ERoleAction.CARD_DELETE)}
                    />
                ))}
                {checkitems.length > 5 && (
                    <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                        <Collapsible.Content asChild>
                            <>
                                {checkitems.slice(5).map((checkitem) => (
                                    <BoardCardCheckitem
                                        checkitem={checkitem}
                                        subCheckitemsMap={subCheckitemsMap}
                                        key={`board-checkitem-${checkitem.uid}`}
                                        orderable={hasRoleAction(Project.ERoleAction.CARD_DELETE)}
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
