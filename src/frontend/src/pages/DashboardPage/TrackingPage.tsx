import { useCallback, useEffect, useRef } from "react";
import { Flex, Loading, Table } from "@/components/base";
import { createShortUUID } from "@/core/utils/StringUtils";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetTrackingList from "@/controllers/api/dashboard/useGetTrackingList";
import { useTranslation } from "react-i18next";
import TrackingRow from "@/pages/DashboardPage/components/TrackingRow";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ProjectCheckitem } from "@/core/models";

function TrackingPage(): JSX.Element {
    const { setIsLoadingRef, setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { mutateAsync, checkitemUIDs, isLastPage } = useGetTrackingList();
    const checkitems = ProjectCheckitem.Model.useModels((model) => checkitemUIDs.includes(model.uid), [checkitemUIDs]);
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
    }, [mutateAsync, checkitems]);

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
                        <Table.Head className="w-1/4 text-center" title={t("dashboard.Checkitem")}>
                            {t("dashboard.Checkitem")}
                        </Table.Head>
                        <Table.Head className="w-1/4 text-center" title={t("dashboard.Card")}>
                            {t("dashboard.Card")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("dashboard.Status")}>
                            {t("dashboard.Status")}
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
                    {checkitems.map((checkitem) => (
                        <TrackingRow checkitem={checkitem} key={`tracking-list-${checkitem.uid}`} />
                    ))}
                </Table.Body>
            </Table.Root>
        </InfiniteScroller>
    );
}

export default TrackingPage;
