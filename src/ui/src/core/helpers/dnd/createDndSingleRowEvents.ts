import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
    draggable as draggableFn,
    dropTargetForElements,
    ElementDropTargetEventBasePayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { TSingleRowData, TSingleRowDroppableTargetData, TSingleRowState, TSingleSymbolSet } from "@/core/helpers/dnd/types";
import createDndSingleDataHelper from "@/core/helpers/dnd/createDndSingleDataHelper";
import { TOrderableModel, TOrderableModelName } from "@/core/models/ModelRegistry";

export interface ICreateDndSingleRowEventsProps<TRowModel extends TOrderableModel<TOrderableModelName>> {
    row: TRowModel;
    symbolSet: TSingleSymbolSet;
    draggable: HTMLElement;
    dropTarget: HTMLElement;
    isHorizontal?: bool;
    setState: React.Dispatch<React.SetStateAction<TSingleRowState>>;
    renderPreview: Parameters<typeof setCustomNativeDragPreview>[0]["render"];
}

export const SINGLE_ROW_IDLE = { type: "idle" } satisfies TSingleRowState;

const createDndSingleRowEvents = <TRowModel extends TOrderableModel<TOrderableModelName>>(props: ICreateDndSingleRowEventsProps<TRowModel>) => {
    const { row, symbolSet, draggable, dropTarget, isHorizontal, setState, renderPreview } = props;
    const { isRowData, shouldHideIndicator } = createDndSingleDataHelper<TRowModel>({ symbolSet, isHorizontal });

    type TRowModelData = TSingleRowData<TRowModel>;
    type TRowDroppableModelData = TSingleRowDroppableTargetData<TRowModel>;

    const getRowData = (context: TRowModelData): TRowModelData => {
        return {
            [symbolSet.root]: true,
            [symbolSet.row]: true,
            row: context.row,
            rect: context.rect,
        };
    };

    const getRowDroppableTargetData = (context: TRowDroppableModelData): TRowDroppableModelData => {
        return {
            [symbolSet.root]: true,
            [symbolSet.row]: true,
            row: context.row,
        };
    };

    function onChange({ source, self }: ElementDropTargetEventBasePayload) {
        if (!isRowData(source.data) || source.data.row.uid === row.uid) {
            return;
        }

        const closestEdge = extractClosestEdge(self.data);
        if (!closestEdge) {
            return;
        }

        if (shouldHideIndicator(row.order, source.data.row.order, closestEdge)) {
            setState(SINGLE_ROW_IDLE);
            return;
        }

        setState({
            type: "is-over",
            dragging: source.data.rect,
            closestEdge,
        });
    }

    return combine(
        draggableFn({
            element: draggable,
            getInitialData: ({ element }) => getRowData({ row, rect: element.getBoundingClientRect() }),
            onGenerateDragPreview({ nativeSetDragImage, location }) {
                setCustomNativeDragPreview({
                    nativeSetDragImage,
                    getOffset: preserveOffsetOnSource({ element: draggable, input: location.current.input }),
                    render: renderPreview,
                });
            },
            onDragStart() {
                setState({ type: "is-dragging" });
            },
            onDrop() {
                setState(SINGLE_ROW_IDLE);
            },
        }),
        dropTargetForElements({
            element: dropTarget,
            canDrop({ source }) {
                return isRowData(source.data);
            },
            getData({ input }) {
                const data = getRowDroppableTargetData({ row });
                return attachClosestEdge(data, {
                    element: dropTarget,
                    input,
                    allowedEdges: isHorizontal ? ["left", "right"] : ["top", "bottom"],
                });
            },
            onDragEnter: onChange,
            onDrag: onChange,
            onDragLeave() {
                setState(SINGLE_ROW_IDLE);
            },
            onDrop() {
                setState(SINGLE_ROW_IDLE);
            },
        })
    );
};

export default createDndSingleRowEvents;
