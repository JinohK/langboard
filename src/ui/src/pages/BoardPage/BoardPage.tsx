import { memo, useEffect } from "react";
import { ROUTES } from "@/core/routing/constants";
import BoardProject from "@/pages/BoardPage/components/board/BoardProject";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import useGetProject from "@/controllers/api/board/useGetProject";
import { SkeletonBoard } from "@/pages/BoardPage/components/board/Board";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";

const BoardPage = memo(({ projectUID, currentUser }: IBoardRelatedPageProps): JSX.Element => {
    const navigate = usePageNavigateRef();
    const { data, error, isFetching } = useGetProject({ uid: projectUID });

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true }),
            },
        });

        handle(error);
    }, [error]);

    return <>{!data || isFetching ? <SkeletonBoard /> : <BoardProject project={data.project} currentUser={currentUser} />}</>;
});

export default BoardPage;
