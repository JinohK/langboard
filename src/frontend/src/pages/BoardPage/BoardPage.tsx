import { memo, useEffect } from "react";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import Board, { SkeletonBoard } from "@/pages/BoardPage/components/board/Board";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import useGetProject from "@/controllers/api/board/useGetProject";

const BoardPage = memo(({ navigate, projectUID, currentUser }: IBoardRelatedPageProps): JSX.Element => {
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

    return <>{!data || isFetching ? <SkeletonBoard /> : <Board navigate={navigate} project={data.project} currentUser={currentUser} />}</>;
});

export default BoardPage;
