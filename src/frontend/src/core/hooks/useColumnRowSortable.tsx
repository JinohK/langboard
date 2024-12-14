import { useRef, useState } from "react";
import {
    Active,
    closestCenter,
    DragEndEvent,
    DragMoveEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    Over,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import createCoordinateGetter from "@/core/hooks/createCoordinateGetter";

export interface ISortableData {
    order: number;
}

export interface ISortableDragData<T extends ISortableData> {
    type: string;
    data: T;
}

export interface IRowDragCallback<TRow extends ISortableData> {
    onDragEnd: (originalRow: TRow, index: number) => void;
    onDragOverOrMove: (row: TRow, index: number, isForeign: bool) => void;
}

export interface IUseColumnRowSortableProps<TColumn extends ISortableData, TRow extends ISortableData> {
    columnDragDataType: string;
    rowDragDataType: string;
    columnCallbacks?: {
        onDragStart?: (activeColumn: TColumn, index: number) => void;
        onDragEnd?: (originalColumn: TColumn, index: number) => void;
    };
    rowCallbacks?: {
        onDragStart?: (activeRow: TRow, index: number) => void;
        onDragEnd?: (containderId: string, originalRow: TRow, index: number) => void;
        onDragOverOrMove?: (containderId: string, activeRow: TRow, index: number, isForeign: bool) => void;
    };
    transformContainerId: (originalRow: TColumn | TRow) => string;
}

function useColumnRowSortable<TColumn extends ISortableData, TRow extends ISortableData>({
    columnDragDataType,
    rowDragDataType,
    columnCallbacks,
    rowCallbacks,
    transformContainerId,
}: IUseColumnRowSortableProps<TColumn, TRow>) {
    const [activeColumn, setActiveColumn] = useState<TColumn | null>(null);
    const [activeRow, setActiveRow] = useState<TRow | null>(null);
    const containerIdRowDragCallbacksRef = useRef<Record<string, IRowDragCallback<TRow>>>({});
    const isUpdatingRef = useRef(false);

    const hasDraggableData = <T extends Active | Over>(entry: T | null | undefined): entry is T => {
        if (!entry) {
            return false;
        }

        const data = entry.data.current;
        return data?.type === columnDragDataType || data?.type === rowDragDataType;
    };

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                delay: 100,
                distance: 0.001,
            },
        }),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: createCoordinateGetter(columnDragDataType),
        })
    );

    const onDragStart = (event: DragStartEvent) => {
        if (!hasDraggableData(event.active)) {
            return;
        }

        const data = event.active.data.current;
        if (data?.type === columnDragDataType) {
            setActiveColumn({ ...data.data });
            columnCallbacks?.onDragStart?.(data.data, data.sortable.index);
            return;
        }

        if (data?.type === rowDragDataType) {
            setActiveRow({ ...data.data });
            rowCallbacks?.onDragStart?.(data.data, data.sortable.index);
            return;
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        const originalColumn = activeColumn;
        const originalRow = activeRow;
        setActiveColumn(null);
        setActiveRow(null);

        if (!hasDraggableData(event.over)) {
            return;
        }

        const overData = event.over.data.current;
        if (!overData?.sortable) {
            return;
        }

        if (overData.type === columnDragDataType) {
            if (!originalColumn) {
                return;
            }

            columnCallbacks?.onDragEnd?.(originalColumn, overData.sortable.index);
            return;
        }

        if (!originalRow) {
            return;
        }

        if (rowCallbacks?.onDragEnd) {
            rowCallbacks?.onDragEnd?.(overData.sortable.containerId, originalRow, overData.sortable.index);
        } else {
            const containerId = overData.sortable.containerId;

            containerIdRowDragCallbacksRef.current[containerId]?.onDragEnd(originalRow, overData.sortable.index);
        }
    };

    const onDragOverOrMove = (event: DragOverEvent | DragMoveEvent) => {
        if (!event.over || event.active.id === event.over.id || !hasDraggableData(event.active) || !hasDraggableData(event.over)) {
            return;
        }

        const activeData = event.active.data.current;
        const overData = event.over.data.current;

        if (activeData?.type === columnDragDataType || activeData?.type !== rowDragDataType || !activeData.sortable || !overData?.sortable) {
            return;
        }

        const droppableMap = new Map<string, DOMRect>();
        event.collisions?.forEach((collision) => {
            if (collision?.data?.droppableContainer) {
                droppableMap.set(collision.data.droppableContainer.id, collision.data.droppableContainer.rect);
            }
        });

        const collisions = closestCenter({
            active: event.active,
            collisionRect: event.over.rect,
            droppableContainers: event.collisions?.map((collision) => collision.data?.droppableContainer) ?? [],
            droppableRects: droppableMap,
            pointerCoordinates: null,
        });

        if (!collisions[0]?.data?.droppableContainer) {
            return;
        }

        overData.data = collisions[0].data.droppableContainer.data.current.data;
        overData.sortable = collisions[0].data.droppableContainer.data.current.sortable;
        overData.type = collisions[0].data.droppableContainer.data.current.type;

        const activeContainerId = transformContainerId(activeData.data);
        const overContainerId = transformContainerId(overData.data);
        const isDifferentColumn = activeContainerId !== overContainerId;
        let overIndex = overData.sortable.index;
        if (overData.type === columnDragDataType) {
            if (!isDifferentColumn) {
                return;
            }

            overIndex = 0;
        }

        if (!isDifferentColumn) {
            if (rowCallbacks?.onDragOverOrMove) {
                rowCallbacks?.onDragOverOrMove?.(activeContainerId, { ...activeData.data }, overIndex, false);
            } else {
                containerIdRowDragCallbacksRef.current[activeContainerId]?.onDragOverOrMove({ ...activeData.data }, overIndex, false);
            }
            return;
        }

        if (isUpdatingRef.current) {
            return;
        }

        isUpdatingRef.current = true;
        if (rowCallbacks?.onDragOverOrMove) {
            rowCallbacks?.onDragOverOrMove?.(overContainerId, { ...activeData.data }, overIndex, true);
            rowCallbacks?.onDragOverOrMove?.(activeContainerId, { ...activeData.data }, -1, true);
        } else {
            containerIdRowDragCallbacksRef.current[overContainerId]?.onDragOverOrMove({ ...activeData.data }, overIndex, true);
            containerIdRowDragCallbacksRef.current[activeContainerId]?.onDragOverOrMove({ ...activeData.data }, -1, true);
        }
        isUpdatingRef.current = false;
    };

    return { activeColumn, activeRow, containerIdRowDragCallbacksRef, sensors, onDragStart, onDragEnd, onDragOverOrMove };
}

export default useColumnRowSortable;
