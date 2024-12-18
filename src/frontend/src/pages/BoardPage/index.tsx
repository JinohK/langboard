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
import useBoardChatAvailableHandlers from "@/controllers/socket/board/useBoardChatAvailableHandlers";
import useSocketErrorHandlers from "@/controllers/socket/shared/useSocketErrorHandlers";
import { useSocket } from "@/core/providers/SocketProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { TDashboardStyledLayoutProps } from "@/components/Layout/DashboardStyledLayout";
import BoardPage from "@/pages/BoardPage/BoardPage";
import { IHeaderNavItem } from "@/components/Header/types";
import BoardWikiPage from "@/pages/BoardPage/BoardWikiPage";
import useCanUseProjectSettings from "@/controllers/api/board/useCanUseProjectSettings";
import BoardSettings from "@/pages/BoardPage/BoardSettings";
import TypeUtils from "@/core/utils/TypeUtils";

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
    const navigate = useRef(usePageNavigate());
    const { aboutMe } = useAuth();
    const [projectUID, pageRoute] = location.pathname.split("/").slice(2);
    const [isReady, setIsReady] = useState(false);
    const [resizableSidebar, setResizableSidebar] = useState<TDashboardStyledLayoutProps["resizableSidebar"]>();
    const [currentPage, setCurrentPage] = useState(getCurrentPage(pageRoute));
    const [canUseSettings, setCanUseSettings] = useState<bool | undefined>(undefined);

    if (!projectUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const { data, error } = useIsProjectAvailable({ uid: projectUID });
    const { mutate: canUseProjectSettingsMutate } = useCanUseProjectSettings({ uid: projectUID });

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!data) {
            return;
        }

        socket.subscribe(ESocketTopic.Board, projectUID);

        const { on: onBoardChatAvailable, send: sendBoardChatAvailable } = useBoardChatAvailableHandlers({
            socket,
            projectUID,
            callback: ({ available }: { available: bool }) => {
                if (available) {
                    setResizableSidebar(() => ({
                        children: (
                            <Suspense>
                                <ChatSidebar uid={projectUID} />
                            </Suspense>
                        ),
                        initialWidth: 280,
                        collapsableWidth: 210,
                        floatingIcon: "message-circle",
                        floatingTitle: "project.Chat with AI",
                        floatingFullScreen: true,
                    }));
                }
                setIsReady(() => true);
            },
        });
        const { on: onSocketError } = useSocketErrorHandlers({
            socket,
            eventKey: `is-board-chat-available-${projectUID}`,
            callback: () => {
                Toast.Add.error(t("errors.Internal server error"));
            },
        });

        const { off: offBoardChatAvailable } = onBoardChatAvailable();
        const { off: offSocketError } = onSocketError();

        sendBoardChatAvailable({});

        canUseProjectSettingsMutate(
            {},
            {
                onSuccess: () => {
                    setCanUseSettings(true);
                },
                onError: () => {
                    setCanUseSettings(false);
                },
            }
        );

        return () => {
            offBoardChatAvailable();
            offSocketError();
        };
    }, [data]);

    const headerNavs: IHeaderNavItem[] = [
        {
            name: "board.Board",
            onClick: () => {
                setCurrentPage("board");
                navigate.current(ROUTES.BOARD.MAIN(projectUID));
            },
            active: currentPage === "board",
        },
        {
            name: "board.Wiki",
            onClick: () => {
                setCurrentPage("wiki");
                navigate.current(ROUTES.BOARD.WIKI(projectUID));
            },
            active: currentPage === "wiki",
        },
        ...(canUseSettings
            ? [
                  {
                      name: "board.Settings",
                      onClick: () => {
                          setCurrentPage("settings");
                          navigate.current(ROUTES.BOARD.SETTINGS(projectUID));
                      },
                      active: currentPage === "settings",
                  },
              ]
            : []),
    ];

    let pageContent;
    switch (currentPage) {
        case "wiki":
            pageContent = <BoardWikiPage navigate={navigate.current} projectUID={projectUID} currentUser={aboutMe()!} />;
            break;
        case "settings":
            if (canUseSettings) {
                pageContent = <BoardSettings navigate={navigate.current} projectUID={projectUID} currentUser={aboutMe()!} />;
            } else if (TypeUtils.isUndefined(canUseSettings)) {
                pageContent = <></>;
            } else {
                Toast.Add.error(t("errors.Forbidden"));
                return <Navigate to={ROUTES.BOARD.MAIN(projectUID)} replace />;
            }
            break;
        default:
            pageContent = <BoardPage navigate={navigate.current} projectUID={projectUID} currentUser={aboutMe()!} />;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={headerNavs} resizableSidebar={resizableSidebar} noPadding>
            {isReady ? pageContent : <></>}
        </DashboardStyledLayout>
    );
});

export default BoardProxy;
