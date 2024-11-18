import { useRef, useState } from "react";
import {
    Active,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    Over,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import coordinateGetter from "@/core/hooks/coordinateGetter";

export interface ISortableData {
    order: number;
}

export interface ISortableDragData<T extends ISortableData> {
    type: string;
    data: T;
}

export interface IRowDragCallback<TRow extends ISortableData> {
    onDragEnd: (originalRow: TRow, index: number) => void;
    onDragOver: (row: TRow, index: number, isForeign: bool) => void;
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
        onDragOver?: (containderId: string, activeRow: TRow, index: number, isForeign: bool) => void;
    };
    transformContainerId: (originalRow: TRow) => string;
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
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter,
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

    const onDragEnd = async (event: DragEndEvent) => {
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
            if (!originalColumn || originalColumn.order === overData.sortable.index) {
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
            const columnId = transformContainerId(originalRow);
            const containerId = overData.sortable.containerId;
            if (columnId === containerId && originalRow.order === overData.sortable.index) {
                return;
            }

            containerIdRowDragCallbacksRef.current[containerId]?.onDragEnd(originalRow, overData.sortable.index);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        if (!event.over || event.active.id === event.over.id || !hasDraggableData(event.active) || !hasDraggableData(event.over)) {
            return;
        }

        const activeData = event.active.data.current;
        const overData = event.over.data.current;

        if (activeData?.type === columnDragDataType) {
            return;
        }

        if (activeData?.type !== rowDragDataType || !activeData.sortable || !overData?.sortable) {
            return;
        }

        const activeContainerId = transformContainerId(activeData.data);
        const overContainerId = overData.sortable.containerId;
        const overIndex = overData.sortable.index;
        const isDifferentColumn = activeContainerId !== overContainerId;
        if (!isDifferentColumn) {
            if (rowCallbacks?.onDragOver) {
                rowCallbacks?.onDragOver?.(activeContainerId, activeData.data, overIndex, false);
            } else {
                containerIdRowDragCallbacksRef.current[activeContainerId]?.onDragOver(activeData.data, overIndex, false);
            }
            return;
        }

        if (isUpdatingRef.current) {
            return;
        }

        isUpdatingRef.current = true;
        if (rowCallbacks?.onDragOver) {
            rowCallbacks?.onDragOver?.(overContainerId, activeData.data, overIndex, true);
            rowCallbacks?.onDragOver?.(activeContainerId, activeData.data, -1, true);
        } else {
            containerIdRowDragCallbacksRef.current[overContainerId]?.onDragOver(activeData.data, overIndex, true);
            containerIdRowDragCallbacksRef.current[activeContainerId]?.onDragOver(activeData.data, -1, true);
        }
        isUpdatingRef.current = false;
    };

    return { activeColumn, activeRow, containerIdRowDragCallbacksRef, sensors, onDragStart, onDragEnd, onDragOver };
}

export default useColumnRowSortable;
