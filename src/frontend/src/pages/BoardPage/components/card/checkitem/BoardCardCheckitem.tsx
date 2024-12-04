import { Collapsible } from "@/components/base";
import useChangeSubCheckitemOrder, { IChangeSubCheckitemOrderForm } from "@/controllers/api/card/checkitem/useChangeSubCheckitemOrder";
import { IBoardCardCheckitem, IBoardCardSubCheckitem } from "@/controllers/api/card/useGetCardDetails";
import useCardCheckitemDeletedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemDeletedHandlers";
import useCardSubCheckitemCreatedHandlers from "@/controllers/socket/card/checkitem/useCardSubCheckitemCreatedHandlers";
import { IRowDragCallback } from "@/core/hooks/useColumnRowSortable";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardSubCheckitem from "@/pages/BoardPage/components/card/checkitem/BoardCardSubCheckitem";
import SharedBoardCardCheckitem from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitem";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { tv } from "tailwind-variants";

export interface IBoardCardCheckitemProps {
    checkitem: IBoardCardCheckitem & {
        isOpenedRef?: React.MutableRefObject<bool>;
    };
    callbacksRef: React.MutableRefObject<Record<string, IRowDragCallback<IBoardCardSubCheckitem>>>;
    subCheckitemsMap: Record<string, IBoardCardSubCheckitem>;
    deletedCheckitem: (uid: string) => void;
    isOverlay?: bool;
}

interface IBoardCardCheckitemDragData {
    type: "Checkitem";
    data: IBoardCardCheckitem;
}

function BoardCardCheckitem({ checkitem, subCheckitemsMap, callbacksRef, deletedCheckitem, isOverlay }: IBoardCardCheckitemProps): JSX.Element {
    if (TypeUtils.isNullOrUndefined(checkitem.isOpenedRef)) {
        checkitem.isOpenedRef = useRef(false);
    }
    const { projectUID, card, socket, hasRoleAction } = useBoardCard();
    const checkitemId = `board-checkitem-${checkitem.uid}`;
    const updater = useReducer((x) => x + 1, 0);
    const [updated, forceUpdate] = updater;
    const subCheckitemsUIDs = useMemo(() => {
        return Object.keys(subCheckitemsMap)
            .filter((subCheckitemUID) => subCheckitemsMap[subCheckitemUID].checkitem_uid === checkitem.uid)
            .sort((a, b) => subCheckitemsMap[a].order - subCheckitemsMap[b].order);
    }, [updated]);
    const subCheckitems = useMemo<IBoardCardSubCheckitem[]>(() => {
        return subCheckitemsUIDs.map((subCheckitemUID) => subCheckitemsMap[subCheckitemUID]);
    }, [subCheckitemsUIDs, updated]);
    const { mutate: changeSubCheckitemOrderMutate } = useChangeSubCheckitemOrder();
    const {
        moveToColumn,
        removeFromColumn,
        reorderInColumn,
        sendRowOrderChanged: sendSubCheckitemOrderChanged,
    } = useReorderRow({
        type: "BoardCardSubCheckitem",
        eventNameParams: { uid: checkitem.uid },
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
    const deletedSubCheckitem = (uid: string) => {
        delete subCheckitemsMap[uid];
        forceUpdate();
    };
    const { on: onCardSubCheckitemCreated } = useCardSubCheckitemCreatedHandlers({
        socket,
        checkitemUID: checkitem.uid,
        callback: (data) => {
            subCheckitemsMap[data.checkitem.uid] = data.checkitem;
            forceUpdate();
        },
    });
    const { on: onCardCheckitemDeleted } = useCardCheckitemDeletedHandlers({
        socket,
        uid: checkitem.uid,
        callback: (data) => {
            deletedSubCheckitem(data.uid);
        },
    });

    useEffect(() => {
        const { off: offCardSubCheckitemCreated } = onCardSubCheckitemCreated();
        const { off: offCardCheckitemDeleted } = onCardCheckitemDeleted();

        return () => {
            offCardSubCheckitemCreated();
            offCardCheckitemDeleted();
        };
    }, []);

    callbacksRef.current[checkitemId] = {
        onDragEnd: (originalSubCheckitem, index) => {
            const isOrderUpdated = originalSubCheckitem.checkitem_uid !== checkitem.uid || originalSubCheckitem.order !== index;
            reorderInColumn(originalSubCheckitem.uid, index);
            if (!isOrderUpdated) {
                forceUpdate();
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
            forceUpdate();

            setTimeout(() => {
                changeSubCheckitemOrderMutate(form, {
                    onSuccess: () => {
                        sendSubCheckitemOrderChanged({
                            from_column_uid: originalSubCheckitem.checkitem_uid,
                            to_column_uid: form.parent_uid,
                            uid: originalSubCheckitem.uid,
                            order: index,
                        });
                    },
                });
            }, 300);
        },
        onDragOver: (activeSubCheckitem, index, isForeign) => {
            if (!isForeign) {
                return;
            }

            const shouldRemove = index === -1;
            if (shouldRemove) {
                removeFromColumn(activeSubCheckitem.uid);
            } else {
                moveToColumn(activeSubCheckitem.uid, index, checkitem.uid);
            }

            if (!checkitem.isOpenedRef!.current) {
                checkitem.isOpenedRef!.current = true;
            }

            forceUpdate();
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
        <div id={checkitemId} {...props}>
            <Collapsible.Root
                open={checkitem.isOpenedRef.current}
                onOpenChange={(opened) => {
                    forceUpdate();
                    checkitem.isOpenedRef!.current = opened;
                }}
            >
                <SharedBoardCardCheckitem
                    checkitem={checkitem}
                    attributes={attributes}
                    listeners={listeners}
                    isParent
                    isOpenedRef={checkitem.isOpenedRef}
                    deleted={deletedCheckitem}
                />
                <Collapsible.Content
                    className={cn(
                        "overflow-hidden text-sm transition-all",
                        "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
                    )}
                >
                    <SortableContext id={checkitemId} items={subCheckitemsUIDs} strategy={verticalListSortingStrategy}>
                        {subCheckitems.map((subCheckitem) => (
                            <BoardCardSubCheckitem
                                key={`board-checkitem-${checkitem.uid}-${subCheckitem.uid}`}
                                checkitem={subCheckitem}
                                deletedSubCheckitem={deletedSubCheckitem}
                            />
                        ))}
                    </SortableContext>
                </Collapsible.Content>
            </Collapsible.Root>
        </div>
    );
}

export default BoardCardCheckitem;
