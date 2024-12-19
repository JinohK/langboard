import { useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { Flex, IconComponent, Table, Tooltip } from "@/components/base";
import { createShortUUID } from "@/core/utils/StringUtils";

export interface ICardsPageProps {}

let curPage = 1;
function CardsPage(props: ICardsPageProps): JSX.Element {
    // TODO: Card, Implemnting the table
    const [cards, setCards] = useState<
        {
            name: string;
            status: string;
            startedAt: Date;
            timeTaken: string;
        }[]
    >([]);

    const createCards = () => {
        const status = ["Request", "Preparation", "Development", "Testing", "Deployment", "Completed"];
        for (let i = 0; i < 30; ++i) {
            cards.push({
                name: `Card ${createShortUUID()}`,
                status: status[Math.floor(Math.random() * status.length)],
                startedAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
                timeTaken: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
            });
        }
        setCards([...cards]);
    };

    if (cards.length === 0) {
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
                        {createCell(true, "Name", "text-center")}
                        {createCell(true, "Status", "w-1/6 text-center")}
                        {createCell(true, "Started at", "w-1/6 text-center")}
                        {createCell(true, "Time taken", "w-1/6 text-center")}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {cards.map((card, index) => (
                        <Table.Row key={card.name}>
                            {createCell(false, (index + 1).toString(), "max-w-0 truncate text-center")}
                            {createCell(false, card.name, "max-w-0 truncate text-left")}
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

export default CardsPage;
