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
import useIsBoardChatAvailableHandlers from "@/controllers/socket/board/chat/useIsBoardChatAvailableHandlers";
import { useSocket } from "@/core/providers/SocketProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { useNavigate } from "react-router-dom";
import { TDashboardStyledLayoutProps } from "@/components/Layout/DashboardStyledLayout";
import BoardPage from "@/pages/BoardPage/BoardPage";
import { IHeaderNavItem } from "@/components/Header/types";
import BoardWikiPage, { SkeletonBoardWikiPage } from "@/pages/BoardPage/BoardWikiPage";
import BoardSettingsPage, { SkeletonBoardSettingsPage } from "@/pages/BoardPage/BoardSettingsPage";
import { BoardChatProvider } from "@/core/providers/BoardChatProvider";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import useBoardAssignedUsersUpdatedHandlers from "@/controllers/socket/board/useBoardAssignedUsersUpdatedHandlers";
import useProjectDeletedHandlers from "@/controllers/socket/shared/useProjectDeletedHandlers";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import useBoardDetailsChangedHandlers from "@/controllers/socket/board/useBoardDetailsChangedHandlers";
import { SkeletonBoard } from "@/pages/BoardPage/components/board/Board";
import useBoardAssignedInternalBotChangedHandlers from "@/controllers/socket/board/useBoardAssignedInternalBotChangedHandlers";
import useInternalBotUpdatedHandlers from "@/controllers/socket/global/useInternalBotUpdatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { Project } from "@/core/models";

const getCurrentPage = (pageRoute?: string): "board" | "wiki" | "settings" => {
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
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const socket = useSocket();
    const navigateRef = useRef(useNavigate());
    const { currentUser } = useAuth();
    const [projectUID, pageRoute] = location.pathname.split("/").slice(2);
    const [isReady, setIsReady] = useState(false);
    const [resizableSidebar, setResizableSidebar] = useState<TDashboardStyledLayoutProps["resizableSidebar"]>();
    const [currentPage, setCurrentPage] = useState(getCurrentPage(pageRoute));
    const { selectCardViewType } = useBoardRelationshipController();
    const [projectTitle, setProjectTitle] = useState("");
    const setProjectTitleRef = useRef<(title: string) => void>(setProjectTitle);
    setProjectTitleRef.current = (title: string) => {
        if (pageRoute !== "card") {
            setPageAliasRef.current(title);
        }

        setProjectTitle(() => title);
    };
    if (!projectUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const { data, isFetching, error, refetch } = useIsProjectAvailable({ uid: projectUID });
    const { on: onIsBoardChatAvailable, send: sendIsBoardChatAvailable } = useIsBoardChatAvailableHandlers({
        projectUID,
        callback: (result) => {
            if (result.available) {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    const existingBots = [...project.internal_bots];
                    const targetBotIndex = existingBots.findIndex((bot) => bot.bot_type === result.bot.bot_type);
                    if (targetBotIndex !== -1 && existingBots[targetBotIndex].uid !== result.bot.uid) {
                        existingBots.splice(targetBotIndex, 1);
                    }
                    existingBots.push(result.bot);
                    project.internal_bots = existingBots;
                }

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
            } else {
                setResizableSidebar(() => ({
                    children: <></>,
                    initialWidth: 280,
                    collapsableWidth: 210,
                    hidden: true,
                }));
            }
            setIsReady(() => true);
        },
    });
    const { on: onBoardAssignedUsersUpdated } = useBoardAssignedUsersUpdatedHandlers({
        projectUID,
        callback: (result) => {
            if (!currentUser || (!result.assigned_user_uids.includes(currentUser.uid) && !currentUser.is_admin)) {
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
    const { on: onProjectDetailsChanged } = useBoardDetailsChangedHandlers({
        projectUID,
        callback: (res) => {
            const title = res.title;
            if (title) {
                setProjectTitleRef.current(title);
            }
        },
    });
    const { on: onBoardAssignedInternalBotChanged } = useBoardAssignedInternalBotChangedHandlers({
        projectUID,
        callback: () => {
            sendIsBoardChatAvailable({});
        },
    });
    const internalBotUpdatedHandlers = useInternalBotUpdatedHandlers({
        callback: () => {
            sendIsBoardChatAvailable({});
        },
    });

    useSwitchSocketHandlers({
        socket,
        handlers: internalBotUpdatedHandlers,
    });

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: {
                after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true }),
            },
            network: {
                after: () => {
                    setTimeout(() => {
                        refetch();
                    }, 5000);
                },
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!data || isFetching) {
            setPageAliasRef.current();
            return;
        }

        setProjectTitleRef.current(data.title);

        socket.subscribe(ESocketTopic.Board, [projectUID], () => {
            onIsBoardChatAvailable();
            onBoardAssignedUsersUpdated();
            onProjectDeleted();
            onProjectDetailsChanged();
            onBoardAssignedInternalBotChanged();
            sendIsBoardChatAvailable({});
        });
        socket.subscribe(ESocketTopic.BoardSettings, [projectUID]);

        return () => {
            socket.unsubscribe(ESocketTopic.Board, [projectUID]);
            socket.unsubscribe(ESocketTopic.BoardSettings, [projectUID]);
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

    let PageComponent;
    let SkeletonComponent;
    switch (currentPage) {
        case "wiki":
            PageComponent = BoardWikiPage;
            SkeletonComponent = SkeletonBoardWikiPage;
            break;
        case "settings":
            PageComponent = BoardSettingsPage;
            SkeletonComponent = SkeletonBoardSettingsPage;
            break;
        default:
            PageComponent = BoardPage;
            SkeletonComponent = SkeletonBoard;
            break;
    }

    return (
        <DashboardStyledLayout
            headerNavs={headerNavs}
            headerTitle={projectTitle}
            resizableSidebar={resizableSidebar ? { ...resizableSidebar, hidden: !!selectCardViewType || !!resizableSidebar.hidden } : undefined}
            noPadding
        >
            {isReady && currentUser ? (
                <PageComponent navigate={navigateRef.current} projectUID={projectUID} currentUser={currentUser} />
            ) : (
                <SkeletonComponent />
            )}
        </DashboardStyledLayout>
    );
});

export default BoardProxy;
