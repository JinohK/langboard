import { memo, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { DashboardStyledLayout } from "@/components/Layout";
import { Toast } from "@/components/base";
import useIsProjectAvailable from "@/controllers/api/board/useIsProjectAvailable";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import ChatSidebar from "@/pages/BoardPage/components/chat/ChatSidebar";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useIsBoardChatAvailableHandlers from "@/controllers/socket/board/useIsBoardChatAvailableHandlers";
import { useSocket } from "@/core/providers/SocketProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { TDashboardStyledLayoutProps } from "@/components/Layout/DashboardStyledLayout";
import BoardPage from "@/pages/BoardPage/BoardPage";
import { IHeaderNavItem } from "@/components/Header/types";
import BoardWikiPage from "@/pages/BoardPage/BoardWikiPage";
import BoardSettingsPage from "@/pages/BoardPage/BoardSettingsPage";
import { BoardChatProvider } from "@/core/providers/BoardChatProvider";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import useBoardAssignedUsersUpdatedHandlers from "@/controllers/socket/board/useBoardAssignedUsersUpdatedHandlers";
import useProjectDeletedHandlers from "@/controllers/socket/shared/useProjectDeletedHandlers";

const getCurrentPage = (pageRoute: string): "board" | "wiki" | "settings" => {
    switch (pageRoute) {
        case "wiki":
            return "wiki";
        case "settings":
            return "settings";
        default:
            return "board";
    }
};

const BoardProxy = memo((): JSX.Element => {
    const [t] = useTranslation();
    const socket = useSocket();
    const navigateRef = useRef(usePageNavigate());
    const { aboutMe } = useAuth();
    const [projectUID, pageRoute] = location.pathname.split("/").slice(2);
    const [isReady, setIsReady] = useState(false);
    const [resizableSidebar, setResizableSidebar] = useState<TDashboardStyledLayoutProps["resizableSidebar"]>();
    const [currentPage, setCurrentPage] = useState(getCurrentPage(pageRoute));
    const { selectCardViewType } = useBoardRelationshipController();
    if (!projectUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const { data, isFetching, error } = useIsProjectAvailable({ uid: projectUID });
    const { on: onIsBoardChatAvailable, send: sendIsBoardChatAvailable } = useIsBoardChatAvailableHandlers({
        projectUID,
        callback: (result) => {
            if (result.available) {
                setResizableSidebar(() => ({
                    children: (
                        <Suspense>
                            <BoardChatProvider projectUID={projectUID} bot={result.bot}>
                                <ChatSidebar />
                            </BoardChatProvider>
                        </Suspense>
                    ),
                    initialWidth: 280,
                    collapsableWidth: 210,
                    floatingIcon: "message-circle",
                    floatingTitle: t("project.Chat with AI"),
                    floatingFullScreen: true,
                }));
            }
            setIsReady(() => true);
        },
    });
    const { on: onBoardAssignedUsersUpdated } = useBoardAssignedUsersUpdatedHandlers({
        projectUID,
        callback: (result) => {
            const currentUser = aboutMe()!;
            if (!result.assigned_member_uids.includes(currentUser.uid) && !currentUser.is_admin) {
                Toast.Add.error(t("errors.Forbidden"));
            }
        },
    });
    const { on: onProjectDeleted } = useProjectDeletedHandlers({
        topic: ESocketTopic.Board,
        projectUID,
        callback: () => {
            Toast.Add.error(t("project.errors.Project closed."));
            navigateRef.current(ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
        },
    });

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("project.errors.Project not found"));
                navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!data || isFetching) {
            return;
        }

        socket.subscribe(ESocketTopic.Board, [projectUID], () => {
            onIsBoardChatAvailable();
            onBoardAssignedUsersUpdated();
            onProjectDeleted();
            sendIsBoardChatAvailable({});
        });

        return () => {
            socket.unsubscribe(ESocketTopic.Board, [projectUID]);
        };
    }, [isFetching]);

    const headerNavs: IHeaderNavItem[] = [
        {
            name: t("board.Board"),
            onClick: () => {
                setCurrentPage("board");
                navigateRef.current(ROUTES.BOARD.MAIN(projectUID));
            },
            active: currentPage === "board",
            hidden: !!selectCardViewType,
        },
        {
            name: t("board.Wiki"),
            onClick: () => {
                setCurrentPage("wiki");
                navigateRef.current(ROUTES.BOARD.WIKI(projectUID));
            },
            active: currentPage === "wiki",
            hidden: !!selectCardViewType,
        },
        {
            name: t("board.Activity"),
            onClick: () => {
                navigateRef.current(ROUTES.BOARD.ACTIVITY(projectUID));
            },
            hidden: !!selectCardViewType,
        },
        {
            name: t("board.Settings"),
            onClick: () => {
                setCurrentPage("settings");
                navigateRef.current(ROUTES.BOARD.SETTINGS(projectUID));
            },
            active: currentPage === "settings",
            hidden: !!selectCardViewType,
        },
    ];

    let pageContent;
    switch (currentPage) {
        case "wiki":
            pageContent = <BoardWikiPage navigate={navigateRef.current} projectUID={projectUID} currentUser={aboutMe()!} />;
            break;
        case "settings":
            pageContent = <BoardSettingsPage navigate={navigateRef.current} projectUID={projectUID} currentUser={aboutMe()!} />;
            break;
        default:
            pageContent = <BoardPage navigate={navigateRef.current} projectUID={projectUID} currentUser={aboutMe()!} />;
            break;
    }

    return (
        <DashboardStyledLayout
            headerNavs={headerNavs}
            headerTitle={data?.title}
            resizableSidebar={resizableSidebar ? { ...resizableSidebar, hidden: !!selectCardViewType } : undefined}
            noPadding
        >
            {isReady ? pageContent : <></>}
        </DashboardStyledLayout>
    );
});

export default BoardProxy;
