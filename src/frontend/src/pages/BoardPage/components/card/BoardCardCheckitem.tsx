import { Collapsible } from "@/components/base";
import { IBoardCardCheckitem, IBoardCardSubCheckitem } from "@/controllers/board/useGetCardDetails";
import { cn } from "@/core/utils/ComponentUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardSubCheckitem from "@/pages/BoardPage/components/card/BoardCardSubCheckitem";
import ShardBoardCardCheckitem from "@/pages/BoardPage/components/card/ShardBoardCardCheckitem";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useReducer, useRef } from "react";
import { tv } from "tailwind-variants";

export interface IBoardCardCheckitemProps {
    checkitem: IBoardCardCheckitem & {
        isOpenedRef?: React.MutableRefObject<bool>;
    };
    subCheckitemsMap: Record<string, IBoardCardSubCheckitem>;
    orderable: bool;
    isOverlay?: bool;
}

interface IBoardCardCheckitemDragData {
    type: "Checkitem";
    data: IBoardCardCheckitem;
}

function BoardCardCheckitem({ checkitem, subCheckitemsMap, isOverlay, orderable }: IBoardCardCheckitemProps): JSX.Element {
    if (TypeUtils.isNullOrUndefined(checkitem.isOpenedRef)) {
        checkitem.isOpenedRef = useRef(false);
    }
    const activeRef = useRef<IBoardCardCheckitem | null>(null);
    const checkitemId = `board-checkitem-${checkitem.uid}`;
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const subCheckitemsUIDs = useMemo(() => {
        return Object.keys(subCheckitemsMap)
            .filter((subCheckitemUID) => subCheckitemsMap[subCheckitemUID].checkitem_uid === checkitem.uid)
            .sort((a, b) => subCheckitemsMap[a].order - subCheckitemsMap[b].order);
    }, [updated]);
    const subCheckitems = useMemo<IBoardCardSubCheckitem[]>(() => {
        return subCheckitemsUIDs.map((subCheckitemUID) => subCheckitemsMap[subCheckitemUID]);
    }, [subCheckitemsUIDs, updated]);
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

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "my-1 snap-center",
        variants: {
            dragging: {
                default: "border-2 border-transparent",
                over: "border-b-2 border-primary/50 opacity-30",
                overlay: "",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (orderable) {
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
                <ShardBoardCardCheckitem
                    checkitem={checkitem}
                    attributes={attributes}
                    listeners={listeners}
                    collapsibleTrigger
                    isOpenedRef={checkitem.isOpenedRef}
                    orderable={orderable}
                />
                <Collapsible.Content
                    className={cn(
                        "overflow-hidden text-sm transition-all",
                        "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
                    )}
                >
                    <SortableContext id={checkitemId} items={subCheckitemsUIDs} strategy={verticalListSortingStrategy}>
                        {checkitem.sub_checkitems.map((subCheckitem) => (
                            <BoardCardSubCheckitem
                                checkitem={subCheckitem}
                                key={`board-checkitem-${checkitem.uid}-${subCheckitem.uid}`}
                                orderable={orderable}
                            />
                        ))}
                    </SortableContext>
                </Collapsible.Content>
            </Collapsible.Root>
        </div>
    );
}

export default BoardCardCheckitem;
