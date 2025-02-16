import { useCallback, useEffect, useRef } from "react";
import { Flex, Loading, Table } from "@/components/base";
import { createShortUUID } from "@/core/utils/StringUtils";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetDashboardCards from "@/controllers/api/dashboard/useGetDashboardCards";
import { useTranslation } from "react-i18next";
import CardRow from "@/pages/DashboardPage/components/CardRow";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ProjectCard } from "@/core/models";

function CardsPage(): JSX.Element {
    const { setIsLoadingRef, setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { mutateAsync, cardUIDs, isLastPage } = useGetDashboardCards();
    const cards = ProjectCard.Model.useModels((model) => cardUIDs.includes(model.uid), [cardUIDs]);
    const isFetchingRef = useRef(false);
    const nextPage = useCallback(async () => {
        if (isFetchingRef.current || isLastPage) {
            return false;
        }

        isFetchingRef.current = true;
        return await new Promise<bool>((resolve) => {
            setTimeout(async () => {
                await mutateAsync({});
                isFetchingRef.current = false;
                resolve(true);
            }, 2500);
        });
    }, [isLastPage, mutateAsync]);

    useEffect(() => {
        setPageAliasRef.current("Dashboard");
        setIsLoadingRef.current(false);
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
