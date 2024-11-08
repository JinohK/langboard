import { ScrollArea } from "@/components/base";
import { IBoardTask } from "@/controllers/board/useGetColumnTasks";
import { IProjectAvailableResponse } from "@/controllers/board/useProjectAvailable";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import BoardCard, { IBoardCardDragData } from "@/pages/BoardPage/components/BoardCard";
import BoardColumn, { IBoardCardDragCallback } from "@/pages/BoardPage/components/BoardColumn";
import {
    Active,
    closestCorners,
    DataRef,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    DroppableContainer,
    getFirstCollision,
    KeyboardCode,
    KeyboardCoordinateGetter,
    KeyboardSensor,
    MouseSensor,
    Over,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface IBoardProps {
    socket: IConnectedSocket;
    project: IProjectAvailableResponse["project"];
}

const DIRECTIONS: string[] = [KeyboardCode.Down, KeyboardCode.Right, KeyboardCode.Up, KeyboardCode.Left];
const coordinateGetter: KeyboardCoordinateGetter = (event, { context: { active, droppableRects, droppableContainers, collisionRect } }) => {
    if (!DIRECTIONS.includes(event.code)) {
        return;
    }

    event.preventDefault();

    if (!active || !collisionRect) {
        return;
    }

    const filteredContainers: DroppableContainer[] = [];

    droppableContainers.getEnabled().forEach((entry) => {
        if (!entry || entry?.disabled) {
            return;
        }

        const rect = droppableRects.get(entry.id);
        if (!rect) {
            return;
        }

        switch (event.code) {
            case KeyboardCode.Down:
                if (collisionRect.top < rect.top) {
                    filteredContainers.push(entry);
                }
                break;
            case KeyboardCode.Up:
                if (collisionRect.top > rect.top) {
                    filteredContainers.push(entry);
                }
                break;
            case KeyboardCode.Left:
                if (collisionRect.left >= rect.left + rect.width) {
                    filteredContainers.push(entry);
                }
                break;
            case KeyboardCode.Right:
                if (collisionRect.left + collisionRect.width <= rect.left) {
                    filteredContainers.push(entry);
                }
                break;
        }
    });

    const collisions = closestCorners({
        active,
        collisionRect: collisionRect,
        droppableRects,
        droppableContainers: filteredContainers,
        pointerCoordinates: null,
    });

    const closestId = getFirstCollision(collisions, "id");

    if (closestId != null) {
        const newDroppable = droppableContainers.get(closestId);
        const newNode = newDroppable?.node.current;
        const newRect = newDroppable?.rect.current;

        if (newNode && newRect) {
            return {
                x: newRect.left,
                y: newRect.top,
            };
        }
    }
};

const hasDraggableData = <T extends Active | Over>(
    entry: T | null | undefined
): entry is T & {
    data: DataRef<IBoardCardDragData>;
} => {
    if (!entry) {
        return false;
    }

    const data = entry.data.current;
    return data?.type === "Task";
};

function Board({ socket, project }: IBoardProps) {
    const [[activeTask, isCardOpened], setActiveTask] = useState<[IBoardTask | null, bool]>([null, false]);
    const dndContextId = useId();
    const callbacksRef = useRef<Record<string, IBoardCardDragCallback>>({});

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
        if (data?.type === "Task") {
            setActiveTask([{ ...data.task }, data.isOpenedRef.current]);
            return;
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const originalTask = activeTask;
        setActiveTask([null, false]);

        const { over } = event;
        if (!originalTask || !over || !hasDraggableData(over)) {
            return;
        }

        const overData = over.data.current;
        if (!overData?.sortable) {
            return;
        }

        const columnId = `board-column-${originalTask.column_uid}`;
        if (columnId === overData.sortable.containerId && originalTask.order === overData.sortable.index) {
            return;
        }

        callbacksRef.current[overData.sortable.containerId]?.onDragEnd(originalTask!, overData.sortable.index);
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) {
            return;
        }

        if (active.id === over.id || !hasDraggableData(active) || !hasDraggableData(over)) {
            return;
        }

        const activeData = active.data.current;
        const overData = over.data.current;

        const isActiveTask = activeData?.type === "Task";
        if (!isActiveTask || !activeData.sortable || !overData?.sortable) {
            return;
        }

        const isDifferentColumn = activeData.sortable.containerId !== overData.sortable.containerId;
        if (!isDifferentColumn) {
            callbacksRef.current[activeData.sortable.containerId]?.onDragOver(activeData.task, overData.sortable.index, false, isCardOpened);
            return;
        }

        callbacksRef.current[activeData.sortable.containerId]?.onDragOver(activeData.task, -1, true, isCardOpened);
        callbacksRef.current[overData.sortable.containerId]?.onDragOver(activeData.task, overData.sortable.index, true, isCardOpened);
    };

    const onMouseDown = (originalEvent: React.MouseEvent<HTMLElement>) => {
        if (originalEvent.target !== originalEvent.currentTarget) {
            return;
        }

        document.documentElement.style.cursor = "grabbing";
        document.documentElement.style.userSelect = "none";
        const target = originalEvent.currentTarget;
        const viewport = target.closest<HTMLDivElement>("[data-radix-scroll-area-viewport]")!;
        const originalMouseX = originalEvent.pageX;
        const originalScrollLeft = viewport.scrollLeft;

        const moveEvent = (event: MouseEvent) => {
            const x = event.pageX;
            const walkX = x - originalMouseX;
            viewport.scrollLeft = originalScrollLeft - walkX;
        };

        const upEvent = () => {
            document.documentElement.style.cursor = "";
            document.documentElement.style.userSelect = "";
            window.removeEventListener("mousemove", moveEvent);
            window.removeEventListener("mouseup", upEvent);
        };

        window.addEventListener("mousemove", moveEvent);
        window.addEventListener("mouseup", upEvent);
    };

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
            <ScrollArea.Root>
                <div className="flex flex-row gap-10 px-4 py-4" onMouseDown={onMouseDown}>
                    <SortableContext items={project.columns.map((col) => col.uid)}>
                        {project.columns.map((col) => (
                            <BoardColumn key={col.uid} socket={socket} project={project} column={col} callbacksRef={callbacksRef} />
                        ))}
                    </SortableContext>
                </div>
                <ScrollArea.Bar orientation="horizontal" />
            </ScrollArea.Root>

            {typeof window !== "undefined" &&
                createPortal(
                    <DragOverlay>{activeTask && <BoardCard project={project} task={activeTask} isOverlay isOpened={isCardOpened} />}</DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
}

export default Board;
