import { memo, useEffect } from "react";
import { Box, Flex, Skeleton } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import useGetProjectDetails from "@/controllers/api/board/useGetProjectDetails";
import BoardSettingsList from "@/pages/BoardPage/components/settings/BoardSettingsList";
import { BoardSettingsProvider } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsUserList from "@/pages/BoardPage/components/settings/BoardSettingsUserList";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

export function SkeletonBoardSettingsPage(): JSX.Element {
    return (
        <Flex direction="col" gap="3" p={{ initial: "4", md: "6", lg: "8" }} items="center">
            <Box w="full" className="max-w-screen-sm">
                <Skeleton h="8" mb="2" className="scroll-m-20" />
                <Box items="center" justify="center" py="4" gap="2" w="full" wrap display={{ initial: "hidden", sm: "flex" }}>
                    <Skeleton h="6" className="w-1/5" />
                    <Skeleton h="6" className="w-1/5" />
                    <Skeleton h="6" className="w-1/5" />
                    <Skeleton h="6" className="w-1/5" />
                </Box>
            </Box>
        </Flex>
    );
}

const BoardSettingsPage = memo(({ projectUID, currentUser }: IBoardRelatedPageProps) => {
    const { data, error } = useGetProjectDetails({ uid: projectUID });
    const navigate = usePageNavigateRef();

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                toast: false,
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true }),
            },
        });

        handle(error);
    }, [error]);

    return (
        <>
            <BoardSettingsUserList currentUser={currentUser} projectUID={projectUID} />
            {data && (
                <BoardSettingsProvider project={data.project} currentUser={currentUser}>
                    <BoardSettingsList />
                </BoardSettingsProvider>
            )}
        </>
    );
});

export default BoardSettingsPage;
