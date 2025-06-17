import { draggable as draggableFn, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import invariant from "tiny-invariant";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import TypeUtils from "@/core/utils/TypeUtils";
import { TDroppableTargetData, TRowData, TRowModelWithKey, TRowState, TSortableData, TSymbolSet } from "@/core/helpers/dnd/types";
import createDndDataHelper from "@/core/helpers/dnd/createDndDataHelper";

export interface ICreateDndRowEventsProps<TRowModel extends TSortableData> {
    row: TRowModelWithKey<TRowModel>;
    symbolSet: TSymbolSet;
    draggable: HTMLElement;
    dropTarget: HTMLElement;
    setState: React.Dispatch<React.SetStateAction<TRowState>>;
    renderPreview: Parameters<typeof setCustomNativeDragPreview>[0]["render"];
}

export const ROW_IDLE = { type: "idle" } satisfies TRowState;

const createDndRowEvents = <TRowModel extends TSortableData>(props: ICreateDndRowEventsProps<TRowModel>) => {
    type TRowModelData = TRowData<TRowModel, TRowModelWithKey<TRowModel>>;
    type TDroppableModelData = TDroppableTargetData<TRowModel, TRowModelWithKey<TRowModel>>;

    const { row, symbolSet, draggable, dropTarget, setState, renderPreview } = props;

    const getRowData = (context: TRowModelData): TRowModelData => {
        return {
            [symbolSet.row]: true,
            rect: context.rect,
            row: context.row,
        };
    };

    const getDroppableTargetData = (context: TDroppableModelData): TDroppableModelData => {
        return {
            [symbolSet.droppable]: true,
            row: context.row,
        };
    };

    const { isRowData, isDraggingARow } = createDndDataHelper<TSortableData, TRowModel>({
        symbolSet,
    });

    return combine(
        draggableFn({
            element: draggable,
            getInitialData: ({ element }) => getRowData({ row, rect: element.getBoundingClientRect() }),
            onGenerateDragPreview({ nativeSetDragImage, location, source }) {
                const data = source.data;
                invariant(isRowData(data));
                setCustomNativeDragPreview({
                    nativeSetDragImage,
                    getOffset: preserveOffsetOnSource({ element: draggable, input: location.current.input }),
                    render(context) {
                        renderPreview(context);
                    },
                });
            },
            onDragStart() {
                setState({ type: "is-dragging" });
            },
            onDrop() {
                setState(ROW_IDLE);
            },
        }),
        dropTargetForElements({
            element: dropTarget,
            getIsSticky: () => true,
            canDrop: isDraggingARow,
            getData: ({ element, input }) => {
                const data = getDroppableTargetData({ row });
                return attachClosestEdge(data, { element, input, allowedEdges: ["top", "bottom"] });
            },
            onDragEnter({ source, self }) {
                if (!isRowData(source.data)) {
                    return;
                }
                if (source.data.row.uid === row.uid) {
                    return;
                }
                const closestEdge = extractClosestEdge(self.data);
                if (!closestEdge) {
                    return;
                }

                setState({ type: "is-over", dragging: source.data.rect, closestEdge });
            },
            onDrag({ source, self }) {
                if (!isRowData(source.data)) {
                    return;
                }
                if (source.data.row.uid === row.uid) {
                    return;
                }
                const closestEdge = extractClosestEdge(self.data);
                if (!closestEdge) {
                    return;
                }
                // optimization - Don't update react state if we don't need to.
                const proposed: TRowState = { type: "is-over", dragging: source.data.rect, closestEdge };
                setState((current) => {
                    if (TypeUtils.isShallowEqual(proposed, current)) {
                        return current;
                    }
                    return proposed;
                });
            },
            onDragLeave({ source }) {
                if (!isRowData(source.data)) {
                    return;
                }
                if (source.data.row.uid === row.uid) {
                    setState({ type: "is-dragging-and-left-self" });
                    return;
                }
                setState(ROW_IDLE);
            },
            onDrop() {
                setState(ROW_IDLE);
            },
        })
    );
};

export default createDndRowEvents;
