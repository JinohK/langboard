import { useCallback, useEffect } from "react";
import { Box, Flex, Loading, Skeleton } from "@/components/base";
import { createShortUUID } from "@/core/utils/StringUtils";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetTrackingList from "@/controllers/api/dashboard/useGetTrackingList";
import { useTranslation } from "react-i18next";
import TrackingRow from "@/pages/DashboardPage/components/TrackingRow";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ProjectCheckitem } from "@/core/models";

export function SkeletonTrackingPage(): JSX.Element {
    return (
        <>
            {Array.from({ length: 4 }).map((_, index) => (
                <Flex items="center" w="full" key={createShortUUID()} mt={index ? "2" : "0"}>
                    <Box px="4" className="w-1/4">
                        <Skeleton h="10" w="full" />
                    </Box>
                    <Box px="4" className="w-1/4">
                        <Skeleton h="10" w="full" />
                    </Box>
                    <Box px="4" className="w-1/6">
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

function TrackingPage(): JSX.Element {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { mutateAsync, checkitemUIDs, isLastPage, isFetchingRef } = useGetTrackingList();
    const checkitems = ProjectCheckitem.Model.useModels((model) => checkitemUIDs.includes(model.uid), [checkitemUIDs]);
    const nextPage = useCallback(async () => {
        if (isFetchingRef.current || isLastPage) {
            return false;
        }

        return await new Promise<bool>((resolve) => {
            setTimeout(async () => {
                await mutateAsync({});
                resolve(true);
            }, 1000);
        });
    }, [isLastPage, mutateAsync]);

    useEffect(() => {
        setPageAliasRef.current("Dashboard");
    }, [mutateAsync, checkitems]);

    return (
        <>
            <InfiniteScroller.Table.Default
                columns={[
                    { name: t("dashboard.Checkitem"), className: "w-1/4 text-center" },
                    { name: t("dashboard.Card"), className: "w-1/4 text-center" },
                    { name: t("dashboard.Status"), className: "w-1/6 text-center" },
                    { name: t("dashboard.Started at"), className: "w-1/6 text-center" },
                    { name: t("dashboard.Time taken"), className: "w-1/6 text-center" },
                ]}
                scrollable={() => document.getElementById("main")}
                loadMore={nextPage}
                hasMore={!isLastPage}
                loader={
                    <Flex justify="center" mt={{ initial: "4", md: "6", lg: "8" }} key={createShortUUID()}>
                        <Loading size="3" variant="secondary" />
                    </Flex>
                }
            >
                {checkitems.map((checkitem) => (
                    <TrackingRow checkitem={checkitem} key={`tracking-list-${checkitem.uid}`} />
                ))}
            </InfiniteScroller.Table.Default>
        </>
    );
}

export default TrackingPage;
