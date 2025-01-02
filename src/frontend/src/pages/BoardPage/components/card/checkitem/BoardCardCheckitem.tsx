import { Box, Collapsible } from "@/components/base";
import useChangeSubCheckitemOrder, { IChangeSubCheckitemOrderForm } from "@/controllers/api/card/checkitem/useChangeSubCheckitemOrder";
import { IRowDragCallback, ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project, ProjectCheckitem } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCardSubCheckitem from "@/pages/BoardPage/components/card/checkitem/BoardCardSubCheckitem";
import SharedBoardCardCheckitem from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitem";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useMemo, useReducer } from "react";
import { tv } from "tailwind-variants";

export interface IBoardCardCheckitemProps {
    checkitem: ProjectCheckitem.TModel;
    callbacksRef: React.MutableRefObject<Record<string, IRowDragCallback<ProjectCheckitem.TModel>>>;
    subCheckitemsMap: Record<string, ProjectCheckitem.TModel>;
    isOverlay?: bool;
}

interface IBoardCardCheckitemDragData extends ISortableDragData<ProjectCheckitem.TModel> {
    type: "Checkitem";
}

const BoardCardCheckitem = memo(({ checkitem, subCheckitemsMap, callbacksRef, isOverlay }: IBoardCardCheckitemProps): JSX.Element => {
    const { projectUID, card, socket, hasRoleAction } = useBoardCard();
    const isOpenedInBoardCard = checkitem.useField("isOpenedInBoardCard");
    const checkitemId = `board-checkitem-${checkitem.uid}`;
    const updater = useReducer((x) => x + 1, 0);
    const [updated] = updater;
    const subCheckitemsUIDs = useMemo(() => {
        return Object.keys(subCheckitemsMap)
            .filter((subCheckitemUID) => subCheckitemsMap[subCheckitemUID].checkitem_uid === checkitem.uid)
            .sort((a, b) => subCheckitemsMap[a].order - subCheckitemsMap[b].order);
    }, [updated]);
    const subCheckitems = useMemo<ProjectCheckitem.TModel[]>(() => {
        return subCheckitemsUIDs.map((subCheckitemUID) => subCheckitemsMap[subCheckitemUID]);
    }, [subCheckitemsUIDs, updated]);
    const { mutate: changeSubCheckitemOrderMutate } = useChangeSubCheckitemOrder();
    const { moveToColumn, removeFromColumn, reorderInColumn } = useReorderRow({
        type: "ProjectCardSubCheckitem",
        eventNameParams: { uid: checkitem.uid },
        topicId: projectUID,
        allRowsMap: subCheckitemsMap,
        rows: subCheckitems,
        columnKey: "checkitem_uid",
        currentColumnId: checkitem.uid,
        socket,
        updater,
    });
    const canReorder = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: checkitem.uid,
        data: {
            type: "Checkitem",
            data: checkitem,
        } satisfies IBoardCardCheckitemDragData,
        attributes: {
            roleDescription: `Checkitem: ${checkitem.title}`,
        },
    });

    callbacksRef.current[checkitemId] = {
        onDragEnd: (originalSubCheckitem, index) => {
            const isOrderUpdated = originalSubCheckitem.checkitem_uid !== checkitem.uid || originalSubCheckitem.order !== index;
            reorderInColumn(originalSubCheckitem.uid, index);
            if (!isOrderUpdated) {
                return;
            }

            const form: IChangeSubCheckitemOrderForm = {
                project_uid: projectUID,
                card_uid: card.uid,
                sub_checkitem_uid: originalSubCheckitem.uid,
                order: index,
            };
            if (originalSubCheckitem.checkitem_uid !== checkitem.uid) {
                form.parent_uid = checkitem.uid;
            }

            subCheckitemsMap[originalSubCheckitem.uid].order = index;
            subCheckitemsMap[originalSubCheckitem.uid].checkitem_uid = checkitem.uid;

            changeSubCheckitemOrderMutate(form);
        },
        onDragOverOrMove: (activeSubCheckitem, index, isForeign) => {
            if (!isForeign) {
                return;
            }

            if (!isOpenedInBoardCard) {
                checkitem.isOpenedInBoardCard = true;
            }

            const shouldRemove = index === -1;
            if (shouldRemove) {
                removeFromColumn(activeSubCheckitem.uid);
            } else {
                moveToColumn(activeSubCheckitem.uid, index, checkitem.uid);
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
        <Box id={checkitemId} {...props}>
            <Collapsible.Root
                open={isOpenedInBoardCard}
                onOpenChange={(opened) => {
                    checkitem.isOpenedInBoardCard = opened;
                }}
            >
                <SharedBoardCardCheckitem checkitem={checkitem} attributes={attributes} listeners={listeners} isParent />
                <BoardCardSubCheckitemList
                    checkitem={checkitem}
                    checkitemId={checkitemId}
                    subCheckitemsUIDs={subCheckitemsUIDs}
                    subCheckitems={subCheckitems}
                />
            </Collapsible.Root>
        </Box>
    );
});

interface IBoardCardSubCheckitemListProps {
    checkitem: ProjectCheckitem.TModel;
    checkitemId: string;
    subCheckitemsUIDs: string[];
    subCheckitems: ProjectCheckitem.TModel[];
}

const BoardCardSubCheckitemList = memo(({ checkitem, checkitemId, subCheckitemsUIDs, subCheckitems }: IBoardCardSubCheckitemListProps) => {
    return (
        <Collapsible.Content
            className={cn(
                "overflow-hidden text-sm transition-all",
                "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
            )}
        >
            <SortableContext id={checkitemId} items={subCheckitemsUIDs} strategy={verticalListSortingStrategy}>
                {subCheckitems.map((subCheckitem) => (
                    <BoardCardSubCheckitem key={`board-checkitem-${checkitem.uid}-${subCheckitem.uid}`} checkitem={subCheckitem} />
                ))}
            </SortableContext>
        </Collapsible.Content>
    );
});

export default BoardCardCheckitem;
