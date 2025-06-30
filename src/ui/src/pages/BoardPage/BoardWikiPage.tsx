import useGetWikis from "@/controllers/api/wiki/useGetWikis";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { BoardWikiProvider } from "@/core/providers/BoardWikiProvider";
import { useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import WikiList, { SkeletonWikiList } from "@/pages/BoardPage/components/wiki/WikiList";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import { memo, useEffect } from "react";

export function SkeletonBoardWikiPage(): JSX.Element {
    return <SkeletonWikiList />;
}

const BoardWikiPage = memo(({ projectUID, currentUser }: IBoardRelatedPageProps) => {
    const socket = useSocket();
    const navigate = usePageNavigateRef();
    const { data, isFetching, error } = useGetWikis({ project_uid: projectUID });

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

    useEffect(() => {
        if (!data || isFetching) {
            return;
        }

        socket.subscribe(ESocketTopic.BoardWiki, [projectUID]);
        socket.subscribe(
            ESocketTopic.BoardWikiPrivate,
            data.wikis.map((wiki) => wiki.uid)
        );

        return () => {
            socket.unsubscribe(ESocketTopic.BoardWiki, [projectUID]);
            socket.unsubscribe(
                ESocketTopic.BoardWikiPrivate,
                data.wikis.map((wiki) => wiki.uid)
            );
        };
    }, [isFetching]);

    return (
        <>
            {!data || isFetching ? (
                <SkeletonWikiList />
            ) : (
                <BoardWikiProvider
                    projectUID={projectUID}
                    projectMembers={data.project_members}
                    projectBots={data.project_bots}
                    currentUser={currentUser}
                >
                    <WikiList />
                </BoardWikiProvider>
            )}
        </>
    );
});

export default BoardWikiPage;
