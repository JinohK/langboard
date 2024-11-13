import { Card, Flex, ScrollArea } from "@/components/base";
import useChangeTaskOrder, { IChangeTaskOrderForm } from "@/controllers/board/useChangeTaskOrder";
import { IBoardTask } from "@/controllers/board/useGetTasks";
import { IBoardProject } from "@/controllers/board/useProjectAvailable";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { ProjectColumn } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { createShortUUID, format } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCard, { SkeletonBoardCard } from "@/pages/BoardPage/components/BoardCard";
import { filterTask, filterTaskMember, IFilterMap, filterTaskRelationships } from "@/pages/BoardPage/components/boardFilterUtils";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { tv } from "tailwind-variants";

export interface IBoardCardDragCallback {
    onDragEnd: (originalActiveTask: IBoardTask, index: number) => void;
    onDragOver: (task: IBoardTask, index: number, isForeign: bool) => void;
}

export interface IBoardColumnProps {
    socket: IConnectedSocket;
    project: IBoardProject;
    filters: IFilterMap;
    column: ProjectColumn.Interface & {
        isOpenedRef?: React.MutableRefObject<bool>;
    };
    callbacksRef: React.MutableRefObject<Record<string, IBoardCardDragCallback>>;
    tasksMap: Record<string, IBoardTask>;
    currentUser: IAuthUser;
    isOverlay?: boolean;
}

export interface IBoardColumnDragData {
    type: "Column";
    column: IBoardColumnProps["column"];
}

function BoardColumn({ socket, project, filters, column, callbacksRef, tasksMap, currentUser, isOverlay }: IBoardColumnProps) {
    if (TypeUtils.isNullOrUndefined(column.isOpenedRef)) {
        column.isOpenedRef = useRef(false);
    }
    const activeRef = useRef<IBoardTask | null>(null);
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const [page, setPage] = useState(1);
    const taskUIDs = useMemo(() => {
        return Object.keys(tasksMap)
            .filter((taskUID) => tasksMap[taskUID].column_uid === column.uid)
            .filter((taskUID) => filterTask(filters, tasksMap[taskUID]))
            .filter((taskUID) => filterTaskMember(filters, project.members, tasksMap[taskUID], currentUser))
            .filter((taskUID) => filterTaskRelationships(filters, tasksMap[taskUID]))
            .sort((a, b) => tasksMap[a].order - tasksMap[b].order);
    }, [filters, updated]);
    const tasks = useMemo<IBoardTask[]>(() => {
        return taskUIDs.slice(0, page * 10).map((taskUID) => tasksMap[taskUID]);
    }, [taskUIDs, page, updated]);
    const closeHoverCardRef = useRef<(() => void) | undefined>();
    const lastPageRef = useRef(Math.ceil(taskUIDs.length / 10));
    const { mutate: changeTaskOrderMutate } = useChangeTaskOrder();
    const columnId = `board-column-${column.uid}`;
    callbacksRef.current[columnId] = {
        onDragEnd: (originalActiveTask, index) => {
            activeRef.current = null;
            const form: IChangeTaskOrderForm = { project_uid: project.uid, task_uid: originalActiveTask.uid, order: index };
            const uidsShouldUpdate = [originalActiveTask.column_uid];
            if (originalActiveTask.column_uid !== column.uid) {
                form.column_uid = column.uid;
                uidsShouldUpdate.push(column.uid);
            }

            if (originalActiveTask.order > index) {
                tasks.slice(index, originalActiveTask.order).forEach((t) => {
                    tasksMap[t.uid].order += 1;
                });
            }

            tasksMap[originalActiveTask.uid].order = index;
            tasksMap[originalActiveTask.uid].column_uid = column.uid;
            forceUpdate();

            setTimeout(() => {
                changeTaskOrderMutate(form, {
                    onSuccess: () => {
                        socket.send(SOCKET_CLIENT_EVENTS.BOARD.TASK_ORDER_CHANGED, {
                            column_uids: uidsShouldUpdate,
                        });
                    },
                });
            }, 300);
        },
        onDragOver: (task, index, isForeign) => {
            if (!isForeign) {
                activeRef.current = task;
                if (task.order > index) {
                    tasks.slice(index, task.order).forEach((t) => {
                        tasksMap[t.uid].order += 1;
                    });
                } else {
                    tasks.slice(task.order + 1, index + 1).forEach((t) => {
                        tasksMap[t.uid].order -= 1;
                    });
                }
                tasksMap[task.uid].order = index;
                forceUpdate();
                return;
            }

            activeRef.current = task;

            const shouldRemove = index === -1;
            if (shouldRemove) {
                tasks.slice(task.order + 1).forEach((t) => {
                    tasksMap[t.uid].order -= 1;
                });
                forceUpdate();
                return;
            }

            tasks.slice(index).forEach((t) => {
                tasksMap[t.uid].order += 1;
            });
            tasksMap[task.uid].order = index;
            tasksMap[task.uid].column_uid = column.uid;
            forceUpdate();
        },
    };
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.uid,
        data: {
            type: "Column",
            column,
        } satisfies IBoardColumnDragData,
        attributes: {
            roleDescription: `Column: ${column.name}`,
        },
    });

    useEffect(() => {
        const shouldRefetchCallback = () => {
            forceUpdate();
        };

        const eventName = format(SOCKET_SERVER_EVENTS.BOARD.TASK_ORDER_CHANGED, { column_uid: column.uid });

        socket.on(eventName, shouldRefetchCallback);

        return () => {
            socket.off(eventName, shouldRefetchCallback);
        };
    }, []);

    useEffect(() => {
        forceUpdate();
    }, [page]);

    const nextPage = (next: number) => {
        if (next - page > 1) {
            return;
        }

        new Promise((resolve) => {
            setPage(next);
            resolve(undefined);
        });
    };

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "my-1 w-80 flex-shrink-0 snap-center",
        variants: {
            dragging: {
                default: "border-2 border-transparent",
                over: "ring-2 opacity-30",
                overlay: "ring-2 ring-primary",
            },
        },
    });

    return (
        <Card.Root
            className={variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            })}
            ref={setNodeRef}
            style={style}
        >
            <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold" {...attributes} {...listeners}>
                <span>{column.name}</span>
            </Card.Header>
            <ScrollArea.Root viewportId={columnId} mutable={updated} onScroll={() => closeHoverCardRef.current?.()}>
                <Card.Content className="flex max-h-[calc(100vh_-_theme(spacing.52))] flex-grow flex-col gap-2 p-3">
                    <InfiniteScroll
                        getScrollParent={() => document.getElementById(columnId)}
                        loadMore={nextPage}
                        loader={<SkeletonBoardCard key={createShortUUID()} />}
                        hasMore={page < lastPageRef.current && taskUIDs.length > 10}
                        threshold={140}
                        initialLoad={false}
                        className="pb-2.5"
                        useWindow={false}
                        pageStart={1}
                    >
                        <SortableContext id={columnId} items={taskUIDs} strategy={verticalListSortingStrategy}>
                            <Flex direction="col" gap="3">
                                {tasks.map((task) => {
                                    return (
                                        <BoardCard
                                            key={`${column.uid}-${task.uid}`}
                                            project={project}
                                            task={task}
                                            filters={filters}
                                            closeHoverCardRef={closeHoverCardRef}
                                        />
                                    );
                                })}
                            </Flex>
                        </SortableContext>
                    </InfiniteScroll>
                </Card.Content>
            </ScrollArea.Root>
        </Card.Root>
    );
}

export default BoardColumn;
