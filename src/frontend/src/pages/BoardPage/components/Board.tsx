import { Flex, ScrollArea, Toast } from "@/components/base";
import UserAvatarList from "@/components/UserAvatarList";
import useChangeColumnOrder from "@/controllers/board/useChangeColumnOrder";
import useGetTasks, { IBoardTask } from "@/controllers/board/useGetTasks";
import { IBoardProject } from "@/controllers/board/useProjectAvailable";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectColumn } from "@/core/models";
import { IAuthUser, useAuth } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import BoardCard, { IBoardCardDragData, IBoardCardProps } from "@/pages/BoardPage/components/BoardCard";
import BoardColumn, { IBoardCardDragCallback, IBoardColumnDragData, IBoardColumnProps } from "@/pages/BoardPage/components/BoardColumn";
import BoardFilter from "@/pages/BoardPage/components/BoardFilter";
import { transformStringFilters } from "@/pages/BoardPage/components/boardFilterUtils";
import coordinateGetter from "@/pages/BoardPage/components/coordinateGetter";
import {
    Active,
    DataRef,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    Over,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

export interface IBoardProps {
    socket: IConnectedSocket;
    project: IBoardProject;
}

const hasDraggableData = <T extends Active | Over>(
    entry: T | null | undefined
): entry is T & {
    data: DataRef<IBoardColumnDragData | IBoardCardDragData>;
} => {
    if (!entry) {
        return false;
    }

    const data = entry.data.current;
    return data?.type === "Column" || data?.type === "Task";
};

function Board({ socket, project }: IBoardProps) {
    const { aboutMe } = useAuth();
    const { data: projectData, error } = useGetTasks({ project_uid: project.uid });
    const [t] = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return (
        <>
            {!projectData || !aboutMe() ? (
                "loading..."
            ) : (
                <BoardResult socket={socket} project={project} columns={projectData.columns} tasks={projectData.tasks} currentUser={aboutMe()!} />
            )}
        </>
    );
}

interface IBoardResultProps {
    socket: IConnectedSocket;
    project: IBoardProject;
    columns: ProjectColumn.Interface[];
    tasks: IBoardTask[];
    currentUser: IAuthUser;
}

function BoardResult({ socket, project, columns: flatColumns, tasks: flatTasks, currentUser }: IBoardResultProps) {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const rawFilters = searchParams.get("filters");
    const filters = transformStringFilters(rawFilters);
    const [t] = useTranslation();
    const [activeColumn, setActiveColumn] = useState<IBoardColumnProps["column"] | null>(null);
    const [activeTask, setActiveTask] = useState<IBoardCardProps["task"] | null>(null);
    const [tasks] = useState<IBoardTask[]>(flatTasks);
    const [columns, setColumns] = useState<ProjectColumn.Interface[]>(flatColumns);
    const tasksMap = useMemo<Record<string, IBoardTask>>(() => {
        const map: Record<string, IBoardTask> = {};
        tasks.forEach((task) => {
            map[task.uid] = task;
        });
        return map;
    }, [tasks]);
    const columnUIDs = useMemo(() => {
        return columns.map((col) => col.uid);
    }, [columns]);
    const dndContextId = useId();
    const callbacksRef = useRef<Record<string, IBoardCardDragCallback>>({});
    const isUpdatingRef = useRef(false);
    const { mutate: changeColumnOrderMutate } = useChangeColumnOrder();

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
            setActiveTask({ ...data.task });
            return;
        }

        if (data?.type === "Column") {
            setActiveColumn({ ...data.column });
            return;
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const originalColumn = activeColumn;
        const originalTask = activeTask;
        setActiveColumn(null);
        setActiveTask(null);

        if (!hasDraggableData(event.over)) {
            return;
        }

        const overData = event.over.data.current;
        if (!overData?.sortable) {
            return;
        }

        if (overData.type === "Column") {
            if (!originalColumn || originalColumn.order === overData.sortable.index) {
                return;
            }

            columns[overData.sortable.index].order = originalColumn.order;
            columns[originalColumn.order].order = overData.sortable.index;

            setColumns((prev) => arrayMove(prev, originalColumn.order, overData.sortable.index));

            changeColumnOrderMutate(
                { project_uid: project.uid, column_uid: originalColumn.uid, order: overData.sortable.index },
                {
                    onError: (error) => {
                        const { handle } = setupApiErrorHandler({
                            wildcardError: () => {
                                Toast.Add.error(t("errors.Internal server error"));
                                columns[originalColumn.order].order = columns[overData.sortable.index].order;
                                columns[overData.sortable.index].order = overData.sortable.index;
                                setColumns((prev) => arrayMove(prev, originalColumn.order, overData.sortable.index));
                            },
                        });

                        handle(error);
                    },
                }
            );
            return;
        }

        if (!originalTask) {
            return;
        }

        const columnId = `board-column-${originalTask.column_uid}`;
        if (columnId === overData.sortable.containerId && originalTask.order === overData.sortable.index) {
            return;
        }

        callbacksRef.current[overData.sortable.containerId]?.onDragEnd(originalTask!, overData.sortable.index);
    };

    const onDragOver = (event: DragOverEvent) => {
        if (!event.over || event.active.id === event.over.id || !hasDraggableData(event.active) || !hasDraggableData(event.over)) {
            return;
        }

        const activeData = event.active.data.current;
        const overData = event.over.data.current;

        if (activeData?.type === "Column") {
            return;
        }

        const isActiveTask = activeData?.type === "Task";
        if (!isActiveTask || !activeData.sortable || !overData?.sortable) {
            return;
        }

        const isDifferentColumn = activeData.sortable.containerId !== overData.sortable.containerId;
        if (!isDifferentColumn) {
            callbacksRef.current[activeData.sortable.containerId]?.onDragOver(activeData.task, overData.sortable.index, false);
            return;
        }

        if (isUpdatingRef.current) {
            return;
        }

        isUpdatingRef.current = true;
        callbacksRef.current[overData.sortable.containerId]?.onDragOver(activeData.task, overData.sortable.index, true);
        callbacksRef.current[activeData.sortable.containerId]?.onDragOver(activeData.task, -1, true);
        isUpdatingRef.current = false;
    };

    const scrollHorizontal = (originalEvent: React.MouseEvent<HTMLElement>) => {
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
        <>
            <Flex justify="between" px="4" pt="4">
                <Flex items="center" gap="1">
                    <UserAvatarList users={project.members} maxVisible={6} size="default" spacing="3" listAlign="start" />
                </Flex>
                <Flex items="center" gap="1">
                    <BoardFilter members={project.members} tasks={flatTasks} filters={filters} />
                </Flex>
            </Flex>

            <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
                <ScrollArea.Root className="h-full max-h-[calc(100vh_-_theme(spacing.28)_-_theme(spacing.2))]">
                    <Flex direction="row" items="start" gap="10" p="4" onMouseDown={scrollHorizontal}>
                        <SortableContext items={columnUIDs} strategy={horizontalListSortingStrategy}>
                            {columns.map((col) => (
                                <BoardColumn
                                    key={col.uid}
                                    socket={socket}
                                    project={project}
                                    filters={filters}
                                    column={col}
                                    callbacksRef={callbacksRef}
                                    tasksMap={tasksMap}
                                    currentUser={currentUser}
                                />
                            ))}
                        </SortableContext>
                    </Flex>
                    <ScrollArea.Bar orientation="horizontal" />
                </ScrollArea.Root>

                {typeof window !== "undefined" &&
                    createPortal(
                        <DragOverlay>
                            {activeColumn && (
                                <BoardColumn
                                    socket={socket}
                                    project={project}
                                    filters={filters}
                                    column={activeColumn}
                                    callbacksRef={callbacksRef}
                                    tasksMap={tasksMap}
                                    currentUser={currentUser}
                                    isOverlay
                                />
                            )}
                            {activeTask && <BoardCard project={project} task={activeTask} filters={filters} isOverlay />}
                        </DragOverlay>,
                        document.body
                    )}
            </DndContext>
        </>
    );
}

export default Board;
