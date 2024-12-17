import { Toast } from "@/components/base";
import useGetWikis from "@/controllers/api/wiki/useGetWikis";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BoardWikiProvider } from "@/core/providers/BoardWikiProvider";
import { useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import WikiList, { SkeletonWikiList } from "@/pages/BoardPage/components/wiki/WikiList";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

const BoardWikiPage = memo(({ navigate, projectUID, currentUser }: IBoardRelatedPageProps) => {
    const [t] = useTranslation();
    const socket = useSocket();
    const { data: data, error } = useGetWikis({ project_uid: projectUID });

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
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!data) {
            return;
        }

        socket.subscribe(ESocketTopic.BoardWiki, projectUID);
        socket.subscribe(ESocketTopic.BoardWikiPrivate, currentUser.username);

        return () => {
            socket.unsubscribe(ESocketTopic.BoardWiki, projectUID);
            socket.unsubscribe(ESocketTopic.BoardWikiPrivate, currentUser.username);
        };
    }, [data]);

    return (
        <>
            {!data ? (
                <SkeletonWikiList />
            ) : (
                <BoardWikiProvider
                    navigate={navigate}
                    projectUID={projectUID}
                    wikis={data.wikis}
                    projectMembers={data.project_members}
                    currentUser={currentUser}
                >
                    <WikiList />
                </BoardWikiProvider>
            )}
        </>
    );
});

export default BoardWikiPage;
