import { useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { IconComponent, Table, Tooltip } from "@/components/base";
import { createShortUUID } from "@/core/utils/StringUtils";

let curPage = 1;
function TrackingPage(): JSX.Element {
    // TODO: Task, Implemnting the table
    const [subtasks, setSubtasks] = useState<
        {
            task: string;
            subtask: string;
            status: string;
            startedAt: Date;
            timeTaken: string;
        }[]
    >([]);

    const createTasks = () => {
        const status = ["Request", "Preparation", "Development", "Testing", "Deployment", "Completed"];
        for (let i = 0; i < 30; ++i) {
            subtasks.push({
                task: `Task ${createShortUUID()}`,
                subtask: `Subask ${createShortUUID()}`,
                status: status[Math.floor(Math.random() * status.length)],
                startedAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
                timeTaken: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
            });
        }
        setSubtasks([...subtasks]);
    };

    if (subtasks.length === 0) {
        createTasks();
    }

    const next = (page: number) => {
        if (page - curPage > 1) {
            return;
        }

        new Promise((resolve) => {
            setTimeout(() => {
                curPage = page;
                createTasks();
                resolve(undefined);
            }, 3500);
        });
    };

    const createCell = (isHead: bool, value: string, className: string) => {
        const Comp = isHead ? Table.Head : Table.Cell;
        return (
            <Comp className={className}>
                <Tooltip.Provider delayDuration={400}>
                    <Tooltip.Root>
                        <Tooltip.Trigger>{value}</Tooltip.Trigger>
                        <Tooltip.Content>{value}</Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>
            </Comp>
        );
    };

    return (
        <InfiniteScroll
            getScrollParent={() => document.getElementById("main")}
            loadMore={next}
            hasMore={true}
            threshold={43}
            loader={
                <div className="mt-6 flex justify-center" key={createShortUUID()}>
                    <IconComponent icon="loader" size="8" className="animate-spin text-gray-500" />
                </div>
            }
            initialLoad={false}
            className="!overflow-y-hidden"
            useWindow={false}
            pageStart={1}
        >
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        {createCell(true, "ID", "w-1/12 text-center")}
                        {createCell(true, "Task", "w-1/5 text-center")}
                        {createCell(true, "Task", "w-1/5 text-center")}
                        {createCell(true, "Status", "w-1/6 text-center")}
                        {createCell(true, "Started at", "w-1/6 text-center")}
                        {createCell(true, "Time taken", "w-1/6 text-center")}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {subtasks.map((task, index) => (
                        <Table.Row key={task.task}>
                            {createCell(false, (index + 1).toString(), "max-w-0 truncate text-center")}
                            {createCell(false, task.task, "max-w-0 truncate text-center")}
                            {createCell(false, task.subtask, "max-w-0 truncate text-center")}
                            {createCell(false, task.status, "max-w-0 truncate text-center")}
                            {createCell(
                                false,
                                task.startedAt.toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "numeric",
                                    day: "numeric",
                                    hour12: false,
                                }),
                                "max-w-0 truncate text-center"
                            )}
                            {createCell(false, task.timeTaken, "max-w-0 truncate text-center")}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </InfiniteScroll>
    );
}

export default TrackingPage;
