import { Card, ScrollArea } from "@/components/base";
import useChangeTaskOrder, { IChangeTaskOrderForm } from "@/controllers/board/useChangeTaskOrder";
import useGetColumnTasks, { IBoardTask } from "@/controllers/board/useGetColumnTasks";
import { IProjectAvailableResponse } from "@/controllers/board/useProjectAvailable";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { ProjectColumn } from "@/core/models";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { createShortUUID, format } from "@/core/utils/StringUtils";
import BoardCard, { SkeletonBoardCard } from "@/pages/BoardPage/components/BoardCard";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroller";

export interface IBoardCardDragCallback {
    onDragEnd: (originalActiveTask: IBoardTask, index: number) => void;
    onDragOver: (task: IBoardTask, index: number, isForeign: bool, isCardOpened: bool) => void;
}

export interface IBoardColumnProps {
    socket: IConnectedSocket;
    project: IProjectAvailableResponse["project"];
    column: ProjectColumn.Interface;
    callbacksRef: React.MutableRefObject<Record<string, IBoardCardDragCallback>>;
}

function BoardColumn({ socket, project, column, callbacksRef }: IBoardColumnProps) {
    const [tasks, setTasks] = useState<IBoardTask[]>([]);
    const activeRef = useRef<[IBoardTask | null, bool]>([null, false]);
    const tasksIds = useMemo(() => {
        return tasks.map((task) => task.uid);
    }, [tasks]);
    const pageRef = useRef(1);
    const { mutate: changeTaskOrderMutate } = useChangeTaskOrder();
    const {
        data: rawColumnTasks,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = useGetColumnTasks(
        { project_uid: project.uid, column_uid: column.uid, page: pageRef.current, limit: 20 },
        {
            getNextPageParam: (lastPage, _, lastPageParam) => {
                if (lastPage.tasks.length == lastPageParam.limit) {
                    return {
                        ...lastPageParam,
                        page: lastPageParam.page + 1,
                    };
                } else {
                    return undefined;
                }
            },
        }
    );
    const columnId = `board-column-${column.uid}`;
    callbacksRef.current[columnId] = {
        onDragEnd: (originalActiveTask, index) => {
            activeRef.current = [null, false];
            const form: IChangeTaskOrderForm = { project_uid: project.uid, task_uid: originalActiveTask.uid, order: index };
            const uidsShouldUpdate = [originalActiveTask.column_uid];
            if (originalActiveTask.column_uid !== column.uid) {
                form.column_uid = column.uid;
                uidsShouldUpdate.push(column.uid);
            }

            changeTaskOrderMutate(form, {
                onSuccess: () => {
                    socket.send(SOCKET_CLIENT_EVENTS.BOARD.TASK_ORDER_CHANGED, {
                        column_uids: uidsShouldUpdate,
                    });
                },
            });
        },
        onDragOver: (task, index, isForeign, isCardOpened) => {
            setTasks((prevTasks) => {
                if (!isForeign) {
                    const taskIndex = prevTasks.findIndex((t) => t.uid === task.uid);
                    if (taskIndex === -1) {
                        return prevTasks;
                    }

                    return arrayMove(prevTasks, taskIndex, index);
                }

                activeRef.current = [task, isCardOpened];

                const shouldRemove = index === -1;
                if (shouldRemove) {
                    const taskIndex = prevTasks.findIndex((t) => t.uid === task.uid);
                    if (taskIndex === -1) {
                        return prevTasks;
                    }

                    prevTasks.splice(taskIndex, 1);
                    prevTasks.forEach((t, i) => {
                        t.order = i;
                    });
                    return [...prevTasks];
                }

                const newTasks: IBoardTask[] = [];
                let isAdded = false;
                for (let i = 0; i < prevTasks.length; ++i) {
                    if (i === index) {
                        task.order = i;
                        prevTasks[i].order = i + 1;
                        newTasks.push(task, prevTasks[i]);
                        isAdded = true;
                        continue;
                    }

                    prevTasks[i].order = i + (isAdded ? 1 : 0);
                    newTasks.push(prevTasks[i]);
                }
                return newTasks;
            });
        },
    };

    useEffect(() => {
        const shouldRefetchCallback = () => {
            refetch();
        };

        const eventName = format(SOCKET_SERVER_EVENTS.BOARD.TASK_ORDER_CHANGED, { column_uid: column.uid });

        socket.on(eventName, shouldRefetchCallback);

        return () => {
            socket.off(eventName, shouldRefetchCallback);
        };
    }, []);

    useEffect(() => {
        if (rawColumnTasks) {
            setTasks(rawColumnTasks.pages.flatMap((page) => page.tasks));
        }
    }, [rawColumnTasks]);

    const nextPage = (page: number) => {
        if (page - pageRef.current > 1) {
            return;
        }

        new Promise((resolve) => {
            setTimeout(async () => {
                const result = await fetchNextPage();
                pageRef.current = page;
                resolve(result);
            }, 2500);
        });
    };

    return (
        <Card.Root className="my-1 w-80 flex-shrink-0">
            <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold">
                <span>{column.name}</span>
            </Card.Header>
            <ScrollArea.Root viewportId={columnId}>
                <Card.Content className="flex max-h-[calc(100vh_-_theme(spacing.52))] flex-grow flex-col gap-2 p-3">
                    <InfiniteScroll
                        getScrollParent={() => document.getElementById(columnId)}
                        loadMore={nextPage}
                        loader={<SkeletonBoardCard key={createShortUUID()} />}
                        hasMore={hasNextPage}
                        threshold={140}
                        initialLoad={false}
                        className="pb-2.5"
                        useWindow={false}
                        pageStart={1}
                    >
                        <SortableContext id={columnId} items={tasksIds}>
                            <div className="flex flex-col gap-3">
                                {tasks.map((task) => (
                                    <BoardCard
                                        key={task.uid}
                                        project={project}
                                        task={task}
                                        isOpened={activeRef.current[0]?.uid === task.uid ? activeRef.current[1] : undefined}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </InfiniteScroll>
                </Card.Content>
            </ScrollArea.Root>
        </Card.Root>
    );
}

export default BoardColumn;
