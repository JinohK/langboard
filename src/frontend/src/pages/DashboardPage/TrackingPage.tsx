import { IconComponent, Table, Tooltip } from "@/components/base";
import { createShortUID } from "@/core/utils/StringUtils";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

function TrackingPage(): JSX.Element {
    // TODO: Task, Implemnting the table
    const [tasks, setTasks] = useState<
        {
            outline: string;
            task: string;
            status: string;
            startedAt: Date;
            timeTaken: string;
        }[]
    >([]);

    const createTasks = () => {
        const status = ["Request", "Preparation", "Development", "Testing", "Deployment", "Completed"];
        for (let i = 0; i < 30; ++i) {
            tasks.push({
                outline: `Outline ${createShortUID()}`,
                task: `Task ${createShortUID()}`,
                status: status[Math.floor(Math.random() * status.length)],
                startedAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
                timeTaken: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
            });
        }
        setTasks([...tasks]);
    };

    if (tasks.length === 0) {
        createTasks();
    }

    const next = () =>
        new Promise((resolve) => {
            setTimeout(() => {
                createTasks();
                resolve(undefined);
            }, 3500);
        });

    const createCell = (isHead: boolean, value: string, className: string) => {
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
            scrollableTarget="main"
            next={next}
            hasMore={true}
            scrollThreshold={0.9}
            loader={
                <div className="mt-6 flex justify-center">
                    <IconComponent icon="loader" className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            }
            dataLength={tasks.length}
            className="overflow-y-hidden"
        >
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        {createCell(true, "ID", "w-1/12 text-center")}
                        {createCell(true, "Outline", "w-1/5 text-center")}
                        {createCell(true, "Task", "w-1/5 text-center")}
                        {createCell(true, "Status", "w-1/6 text-center")}
                        {createCell(true, "Started at", "w-1/6 text-center")}
                        {createCell(true, "Time taken", "w-1/6 text-center")}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {tasks.map((task, index) => (
                        <Table.Row key={task.outline}>
                            {createCell(false, (index + 1).toString(), "max-w-0 truncate text-center")}
                            {createCell(false, task.outline, "max-w-0 truncate text-center")}
                            {createCell(false, task.task, "max-w-0 truncate text-center")}
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
