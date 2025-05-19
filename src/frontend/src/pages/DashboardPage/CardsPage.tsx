import { useCallback, useEffect } from "react";
import { Box, Flex, Loading, Skeleton, Table } from "@/components/base";
import { createShortUUID } from "@/core/utils/StringUtils";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetDashboardCards from "@/controllers/api/dashboard/useGetDashboardCards";
import { useTranslation } from "react-i18next";
import CardRow from "@/pages/DashboardPage/components/CardRow";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ProjectCard } from "@/core/models";

export function SkeletonCardsPage(): JSX.Element {
    return (
        <>
            {Array.from({ length: 4 }).map((_, index) => (
                <Flex items="center" w="full" key={createShortUUID()} mt={index ? "2" : "0"}>
                    <Box px="4" className="w-1/3">
                        <Skeleton h="10" w="full" />
                    </Box>
                    <Box px="4" className="w-1/3">
                        <Skeleton h="10" w="full" />
                    </Box>
                    <Box px="4" className="w-1/6">
                        <Skeleton h="10" w="full" />
                    </Box>
                    <Box px="4" className="w-1/6">
                        <Skeleton h="10" w="full" />
                    </Box>
                </Flex>
            ))}
        </>
    );
}

function CardsPage(): JSX.Element {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { mutateAsync, cardUIDs, isLastPage, isFetchingRef } = useGetDashboardCards();
    const cards = ProjectCard.Model.useModels((model) => cardUIDs.includes(model.uid), [cardUIDs]);
    const nextPage = useCallback(async () => {
        if (isFetchingRef.current || isLastPage) {
            return false;
        }

        return await new Promise<bool>((resolve) => {
            setTimeout(async () => {
                await mutateAsync({});
                resolve(true);
            }, 2500);
        });
    }, [isLastPage, mutateAsync]);

    useEffect(() => {
        setPageAliasRef.current("Dashboard");
    }, [mutateAsync, cards]);

    return (
        <InfiniteScroller
            scrollable={() => document.getElementById("main")}
            loadMore={nextPage}
            hasMore={!isLastPage}
            threshold={18}
            loader={
                <Flex justify="center" mt="6" key={createShortUUID()}>
                    <Loading size="3" variant="secondary" />
                </Flex>
            }
            className="!overflow-y-hidden"
        >
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head className="w-1/3 text-center" title={t("dashboard.Title")}>
                            {t("dashboard.Title")}
                        </Table.Head>
                        <Table.Head className="w-1/3 text-center" title={t("dashboard.Column")}>
                            {t("dashboard.Column")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("dashboard.Started at")}>
                            {t("dashboard.Started at")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("dashboard.Time taken")}>
                            {t("dashboard.Time taken")}
                        </Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {cards.map((card) => (
                        <CardRow card={card} key={`cards-list-${card.uid}`} />
                    ))}
                </Table.Body>
            </Table.Root>
        </InfiniteScroller>
    );
}

export default CardsPage;
