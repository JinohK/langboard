import { memo, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { DashboardStyledLayout } from "@/components/Layout";
import { Toast } from "@/components/base";
import useIsProjectAvailable from "@/controllers/api/board/useIsProjectAvailable";
import { ROUTES } from "@/core/routing/constants";
import ChatSidebar from "@/pages/BoardPage/components/chat/ChatSidebar";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useIsBoardChatAvailableHandlers from "@/controllers/socket/board/chat/useIsBoardChatAvailableHandlers";
import { useSocket } from "@/core/providers/SocketProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import BoardPage from "@/pages/BoardPage/BoardPage";
import { IHeaderNavItem } from "@/components/Header/types";
import BoardWikiPage, { SkeletonBoardWikiPage } from "@/pages/BoardPage/BoardWikiPage";
import BoardSettingsPage, { SkeletonBoardSettingsPage } from "@/pages/BoardPage/BoardSettingsPage";
import { BoardChatProvider } from "@/core/providers/BoardChatProvider";
import { TBoardViewType, useBoardController } from "@/core/providers/BoardController";
import useBoardAssignedUsersUpdatedHandlers from "@/controllers/socket/board/useBoardAssignedUsersUpdatedHandlers";
import useProjectDeletedHandlers from "@/controllers/socket/shared/useProjectDeletedHandlers";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import useBoardDetailsChangedHandlers from "@/controllers/socket/board/useBoardDetailsChangedHandlers";
import { SkeletonBoard } from "@/pages/BoardPage/components/board/Board";
import useBoardAssignedInternalBotChangedHandlers from "@/controllers/socket/board/useBoardAssignedInternalBotChangedHandlers";
import useInternalBotUpdatedHandlers from "@/controllers/socket/global/useInternalBotUpdatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { InternalBotModel, Project } from "@/core/models";
import { EHttpStatus, ESocketTopic } from "@langboard/core/enums";
import useBoardBotStatusMapHandlers from "@/controllers/socket/board/useBoardBotStatusMapHandlers";

const getCurrentPage = (pageRoute?: string): TBoardViewType => {
    switch (pageRoute) {
        case "card":
            return "card";
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
    const socket = useSocket();
    const navigate = usePageNavigateRef();
    const [projectUID, pageRoute] = location.pathname.split("/").slice(2);
    const [projectTitle, setProjectTitle] = useState("");
    if (!projectUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const { data, isFetching, error, refetch } = useIsProjectAvailable({ uid: projectUID });
    const { send: sendBoardBotStatusMap } = useBoardBotStatusMapHandlers({ projectUID });

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

        if (pageRoute !== "card") {
            setPageAliasRef.current(data.title);
        }

        setProjectTitle(() => data.title);

        socket.subscribe(ESocketTopic.Board, [projectUID], () => {
            sendBoardBotStatusMap({});
        });
        socket.subscribe(ESocketTopic.BoardSettings, [projectUID]);

        return () => {
            socket.unsubscribe(ESocketTopic.Board, [projectUID]);
            socket.unsubscribe(ESocketTopic.BoardSettings, [projectUID]);
        };
    }, [isFetching]);

    return (
        <BoardProxyDisplay
            projectUID={projectUID}
            pageRoute={pageRoute}
            isFetching={isFetching}
            projectTitle={projectTitle}
            setProjectTitle={setProjectTitle}
        />
    );
});

interface IBoardProxyDisplayProps {
    projectUID: string;
    pageRoute: string;
    isFetching: bool;
    projectTitle: string;
    setProjectTitle: React.Dispatch<React.SetStateAction<string>>;
}

function BoardProxyDisplay({ projectUID, pageRoute, isFetching, projectTitle, setProjectTitle }: IBoardProxyDisplayProps): JSX.Element {
    const [t] = useTranslation();
    const { setPageAliasRef } = usePageHeader();
    const socket = useSocket();
    const { currentUser } = useAuth();
    const navigate = usePageNavigateRef();
    const [isReady, setIsReady] = useState(false);
    const { boardViewType, selectCardViewType, chatResizableSidebar, chatSidebarRef, setBoardViewType, setChatResizableSidebar } =
        useBoardController();
    const isBoardChatAvailableHandlers = useMemo(
        () =>
            useIsBoardChatAvailableHandlers({
                projectUID,
                callback: (result) => {
                    if (result.available) {
                        setChatResizableSidebar(() => ({
                            children: (
                                <Suspense>
                                    <BoardChatProvider projectUID={projectUID} bot={result.bot}>
                                        <ChatSidebar ref={chatSidebarRef} />
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
                        setChatResizableSidebar(() => ({
                            children: <></>,
                            initialWidth: 280,
                            collapsableWidth: 210,
                            hidden: true,
                        }));
                    }
                    setIsReady(() => true);
                },
            }),
        [projectUID, setChatResizableSidebar, setIsReady]
    );
    const boardAssignedUsersUpdatedHandlers = useMemo(
        () =>
            useBoardAssignedUsersUpdatedHandlers({
                projectUID,
                callback: (result) => {
                    if (!currentUser || (!result.assigned_user_uids.includes(currentUser.uid) && !currentUser.is_admin)) {
                        Toast.Add.error(t("errors.Forbidden"));
                    }
                },
            }),
        [projectUID, currentUser]
    );
    const projectDeletedHandlers = useMemo(
        () =>
            useProjectDeletedHandlers({
                topic: ESocketTopic.Board,
                projectUID,
                callback: () => {
                    Toast.Add.error(t("project.errors.Project closed."));
                    navigate(ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                },
            }),
        [projectUID, navigate]
    );
    const boardDetailsChangedHandlers = useMemo(
        () =>
            useBoardDetailsChangedHandlers({
                projectUID,
                callback: (res) => {
                    const title = res.title;
                    if (title) {
                        if (pageRoute !== "card") {
                            setPageAliasRef.current(title);
                        }

                        setProjectTitle(() => title);
                    }
                },
            }),
        [projectUID, setProjectTitle]
    );
    const boardAssignedInternalBotChangedHandlers = useMemo(
        () =>
            useBoardAssignedInternalBotChangedHandlers({
                projectUID,
                callback: (data) => {
                    const internalBot = InternalBotModel.Model.getModel(data.internal_bot_uid);
                    const project = Project.Model.getModel(projectUID);
                    if (internalBot && project) {
                        const existingBots = [...project.internal_bots];
                        const targetBotIndex = existingBots.findIndex((bot) => bot.bot_type === internalBot.bot_type);
                        if (targetBotIndex !== -1 && existingBots[targetBotIndex].uid !== internalBot.uid) {
                            existingBots.splice(targetBotIndex, 1);
                        }
                        existingBots.push(internalBot);
                        project.internal_bots = existingBots;
                    }

                    if (internalBot && internalBot.bot_type !== InternalBotModel.EInternalBotType.ProjectChat) {
                        return;
                    }

                    isBoardChatAvailableHandlers.send({});
                },
            }),
        [projectUID, isBoardChatAvailableHandlers]
    );
    const internalBotUpdatedHandlers = useMemo(
        () =>
            useInternalBotUpdatedHandlers({
                callback: (data) => {
                    const internalBot = InternalBotModel.Model.getModel(data.uid);
                    if (internalBot && internalBot.bot_type !== InternalBotModel.EInternalBotType.ProjectChat) {
                        return;
                    }

                    isBoardChatAvailableHandlers.send({});
                },
            }),
        [projectUID, isBoardChatAvailableHandlers]
    );

    const { subscribedTopics } = useSwitchSocketHandlers({
        socket,
        handlers: [
            isBoardChatAvailableHandlers,
            boardAssignedUsersUpdatedHandlers,
            projectDeletedHandlers,
            boardDetailsChangedHandlers,
            boardAssignedInternalBotChangedHandlers,
            internalBotUpdatedHandlers,
        ],
        dependencies: [
            isBoardChatAvailableHandlers,
            boardAssignedUsersUpdatedHandlers,
            projectDeletedHandlers,
            boardDetailsChangedHandlers,
            boardAssignedInternalBotChangedHandlers,
            internalBotUpdatedHandlers,
        ],
    });

    useEffect(() => {
        if (isFetching || !subscribedTopics.includes(ESocketTopic.Board)) {
            return;
        }

        isBoardChatAvailableHandlers.send({});
    }, [isFetching, subscribedTopics]);

    useEffect(() => {
        setBoardViewType(getCurrentPage(pageRoute));
    }, [pageRoute]);

    const headerNavs: IHeaderNavItem[] = [
        {
            name: t("board.Board"),
            onClick: () => {
                setBoardViewType("board");
                navigate(ROUTES.BOARD.MAIN(projectUID), { smooth: true });
            },
            active: boardViewType === "board" || boardViewType === "card",
            hidden: !!selectCardViewType,
        },
        {
            name: t("board.Wiki"),
            onClick: () => {
                setBoardViewType("wiki");
                navigate(ROUTES.BOARD.WIKI(projectUID), { smooth: true });
            },
            active: boardViewType === "wiki",
            hidden: !!selectCardViewType,
        },
        {
            name: t("board.Activity"),
            onClick: () => {
                navigate({
                    pathname: ROUTES.BOARD.ACTIVITY(projectUID),
                    hash: location.pathname,
                });
            },
            hidden: !!selectCardViewType,
        },
        {
            name: t("board.Settings"),
            onClick: () => {
                setBoardViewType("settings");
                navigate(ROUTES.BOARD.SETTINGS(projectUID), { smooth: true });
            },
            active: boardViewType === "settings",
            hidden: !!selectCardViewType,
        },
    ];

    let PageComponent;
    let SkeletonComponent;
    switch (boardViewType) {
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
            resizableSidebar={
                chatResizableSidebar ? { ...chatResizableSidebar, hidden: !!selectCardViewType || !!chatResizableSidebar.hidden } : undefined
            }
            className="!p-0"
        >
            {isReady && currentUser ? <PageComponent projectUID={projectUID} currentUser={currentUser} /> : <SkeletonComponent />}
        </DashboardStyledLayout>
    );
}

export default BoardProxy;
