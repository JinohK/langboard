import { IconComponent, Table, Tooltip } from "@/components/base";
import { createShortUID } from "@/core/utils/StringUtils";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

function OutlinesPage(): JSX.Element {
    // TODO: Outline, Implemnting the table
    const [outlines, setOutlines] = useState<
        {
            name: string;
            status: string;
            startedAt: Date;
            timeTaken: string;
        }[]
    >([]);

    const createTasks = () => {
        const status = ["Request", "Preparation", "Development", "Testing", "Deployment", "Completed"];
        for (let i = 0; i < 30; ++i) {
            outlines.push({
                name: `Task ${createShortUID()}`,
                status: status[Math.floor(Math.random() * status.length)],
                startedAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
                timeTaken: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
            });
        }
        setOutlines([...outlines]);
    };

    if (outlines.length === 0) {
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
            dataLength={outlines.length}
            className="overflow-y-hidden"
        >
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        {createCell(true, "ID", "w-1/12 text-center")}
                        {createCell(true, "Name", "text-center")}
                        {createCell(true, "Status", "w-1/6 text-center")}
                        {createCell(true, "Started at", "w-1/6 text-center")}
                        {createCell(true, "Time taken", "w-1/6 text-center")}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {outlines.map((task, index) => (
                        <Table.Row key={task.name}>
                            {createCell(false, (index + 1).toString(), "max-w-0 truncate text-center")}
                            {createCell(false, task.name, "max-w-0 truncate text-left")}
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

export default OutlinesPage;
