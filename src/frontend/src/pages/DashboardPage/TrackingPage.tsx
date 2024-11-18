import { useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { Flex, IconComponent, Table, Tooltip } from "@/components/base";
import { createShortUUID } from "@/core/utils/StringUtils";

let curPage = 1;
function TrackingPage(): JSX.Element {
    // TODO: Card, Implemnting the table
    const [subcards, setSubcards] = useState<
        {
            card: string;
            subcard: string;
            status: string;
            startedAt: Date;
            timeTaken: string;
        }[]
    >([]);

    const createCards = () => {
        const status = ["Request", "Preparation", "Development", "Testing", "Deployment", "Completed"];
        for (let i = 0; i < 30; ++i) {
            subcards.push({
                card: `Card ${createShortUUID()}`,
                subcard: `Subask ${createShortUUID()}`,
                status: status[Math.floor(Math.random() * status.length)],
                startedAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
                timeTaken: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
            });
        }
        setSubcards([...subcards]);
    };

    if (subcards.length === 0) {
        createCards();
    }

    const next = (page: number) => {
        if (page - curPage > 1) {
            return;
        }

        new Promise((resolve) => {
            setTimeout(() => {
                curPage = page;
                createCards();
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
                <Flex justify="center" mt="6" key={createShortUUID()}>
                    <IconComponent icon="loader" size="8" className="animate-spin text-gray-500" />
                </Flex>
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
                        {createCell(true, "Card", "w-1/5 text-center")}
                        {createCell(true, "Card", "w-1/5 text-center")}
                        {createCell(true, "Status", "w-1/6 text-center")}
                        {createCell(true, "Started at", "w-1/6 text-center")}
                        {createCell(true, "Time taken", "w-1/6 text-center")}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {subcards.map((card, index) => (
                        <Table.Row key={card.card}>
                            {createCell(false, (index + 1).toString(), "max-w-0 truncate text-center")}
                            {createCell(false, card.card, "max-w-0 truncate text-center")}
                            {createCell(false, card.subcard, "max-w-0 truncate text-center")}
                            {createCell(false, card.status, "max-w-0 truncate text-center")}
                            {createCell(
                                false,
                                card.startedAt.toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "numeric",
                                    day: "numeric",
                                    hour12: false,
                                }),
                                "max-w-0 truncate text-center"
                            )}
                            {createCell(false, card.timeTaken, "max-w-0 truncate text-center")}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </InfiniteScroll>
    );
}

export default TrackingPage;
