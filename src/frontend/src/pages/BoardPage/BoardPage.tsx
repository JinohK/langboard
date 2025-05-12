import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import Board, { SkeletonBoard } from "@/pages/BoardPage/components/board/Board";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import useGetProject from "@/controllers/api/board/useGetProject";

const BoardPage = memo(({ navigate, projectUID, currentUser }: IBoardRelatedPageProps): JSX.Element => {
    const [t] = useTranslation();
    const { data, error } = useGetProject({ uid: projectUID });

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found."));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return <>{!data ? <SkeletonBoard /> : <Board navigate={navigate} project={data.project} currentUser={currentUser} />}</>;
});

export default BoardPage;
