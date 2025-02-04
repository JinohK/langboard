import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import useGetProjetDetails from "@/controllers/api/board/useGetProjectDetails";
import BoardSettingsList from "@/pages/BoardPage/components/settings/BoardSettingsList";
import { BoardSettingsProvider } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsUserList from "@/pages/BoardPage/components/settings/BoardSettingsUserList";

const BoardSettingsPage = memo(({ navigate, projectUID, currentUser }: IBoardRelatedPageProps) => {
    const [t] = useTranslation();
    const { data, error } = useGetProjetDetails({ uid: projectUID });

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {},
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return (
        <>
            <BoardSettingsUserList currentUser={currentUser} projectUID={projectUID} />
            {data && (
                <BoardSettingsProvider navigate={navigate} project={data.project} currentUser={currentUser}>
                    <BoardSettingsList />
                </BoardSettingsProvider>
            )}
        </>
    );
});

export default BoardSettingsPage;
