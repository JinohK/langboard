import { draggable as draggableFn, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import invariant from "tiny-invariant";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { unsafeOverflowAutoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { TColumnState, TSettings, TSortableData, TSymbolSet } from "@/core/helpers/dnd/types";
import createDndDataHelper from "@/core/helpers/dnd/createDndDataHelper";

export const COLUMN_IDLE = { type: "idle" } satisfies TColumnState;

export interface ICreateDndColumnEventsProps<TColumnModel extends TSortableData> {
    column: TColumnModel;
    symbolSet: TSymbolSet;
    draggable: HTMLElement;
    dropTarget: HTMLElement;
    scrollable: HTMLElement;
    settings: TSettings;
    setState: React.Dispatch<React.SetStateAction<TColumnState>>;
    renderPreview: Parameters<typeof setCustomNativeDragPreview>[0]["render"];
}

const createDndColumnEvents = <TColumnModel extends TSortableData>(props: ICreateDndColumnEventsProps<TColumnModel>) => {
    const { column, symbolSet, draggable, dropTarget, scrollable, settings, setState, renderPreview } = props;

    const columnData = {
        [symbolSet.column]: true,
        column,
    };

    const { isColumnData, isDraggingAColumn, isRowData, isDraggingARow, setIsRowOver } = createDndDataHelper<TColumnModel, TSortableData>({
        symbolSet,
        setColumnState: setState,
    });

    return combine(
        draggableFn({
            element: draggable,
            getInitialData: () => columnData,
            onGenerateDragPreview({ source, location, nativeSetDragImage }) {
                const data = source.data;
                invariant(isColumnData(data));
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
                setState(COLUMN_IDLE);
            },
        }),
        dropTargetForElements({
            element: dropTarget,
            getData: () => columnData,
            canDrop({ source }) {
                return isDraggingARow({ source }) || isDraggingAColumn({ source });
            },
            getIsSticky: () => true,
            onDragStart({ source, location }) {
                if (isRowData(source.data)) {
                    setIsRowOver({ data: source.data, location });
                }
            },
            onDragEnter({ source, location }) {
                if (isRowData(source.data)) {
                    setIsRowOver({ data: source.data, location });
                    return;
                }
                if (isColumnData(source.data) && source.data.column.uid !== column.uid) {
                    setState({ type: "is-column-over" });
                }
            },
            onDropTargetChange({ source, location }) {
                if (isRowData(source.data)) {
                    setIsRowOver({ data: source.data, location });
                    return;
                }
            },
            onDragLeave({ source }) {
                if (isColumnData(source.data) && source.data.column.uid === column.uid) {
                    return;
                }
                setState(COLUMN_IDLE);
            },
            onDrop() {
                setState(COLUMN_IDLE);
            },
        }),
        autoScrollForElements({
            canScroll({ source }) {
                if (!settings.isOverElementAutoScrollEnabled) {
                    return false;
                }

                return isDraggingARow({ source });
            },
            getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
            element: scrollable,
        }),
        unsafeOverflowAutoScrollForElements({
            element: scrollable,
            getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
            canScroll({ source }) {
                if (!settings.isOverElementAutoScrollEnabled) {
                    return false;
                }

                if (!settings.isOverflowScrollingEnabled) {
                    return false;
                }

                return isDraggingARow({ source });
            },
            getOverflow() {
                return {
                    forTopEdge: {
                        top: 1000,
                    },
                    forBottomEdge: {
                        bottom: 1000,
                    },
                };
            },
        })
    );
};

export default createDndColumnEvents;
