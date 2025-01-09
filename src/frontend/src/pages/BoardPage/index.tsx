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
import useCanUseProjectSettings from "@/controllers/api/board/useCanUseProjectSettings";
import BoardSettingsPage from "@/pages/BoardPage/BoardSettings";
import TypeUtils from "@/core/utils/TypeUtils";
import { BoardChatProvider } from "@/core/providers/BoardChatProvider";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";

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
    const { selectCardViewType } = useBoardRelationshipController();
    if (!projectUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const { data, isFetching, error } = useIsProjectAvailable({ uid: projectUID });
    const { mutate: canUseProjectSettingsMutate } = useCanUseProjectSettings({ uid: projectUID });
    const { on: onIsBoardChatAvailable, send: sendIsBoardChatAvailable } = useIsBoardChatAvailableHandlers({
        projectUID,
        callback: (data) => {
            if (data.available) {
                setResizableSidebar(() => ({
                    children: (
                        <Suspense>
                            <BoardChatProvider projectUID={projectUID} bot={data.bot}>
                                <ChatSidebar />
                            </BoardChatProvider>
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
        if (!data || isFetching) {
            return;
        }

        socket.subscribe(ESocketTopic.Board, [projectUID], () => {
            onIsBoardChatAvailable();
            sendIsBoardChatAvailable({});
        });

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
            socket.unsubscribe(ESocketTopic.Board, [projectUID]);
        };
    }, [isFetching]);

    const headerNavs: IHeaderNavItem[] = [
        {
            name: "board.Board",
            onClick: () => {
                setCurrentPage("board");
                navigate.current(ROUTES.BOARD.MAIN(projectUID));
            },
            active: currentPage === "board",
            hidden: !!selectCardViewType,
        },
        {
            name: "board.Wiki",
            onClick: () => {
                setCurrentPage("wiki");
                navigate.current(ROUTES.BOARD.WIKI(projectUID));
            },
            active: currentPage === "wiki",
            hidden: !!selectCardViewType,
        },
        {
            name: "board.Settings",
            onClick: () => {
                if (!canUseSettings) {
                    return;
                }

                setCurrentPage("settings");
                navigate.current(ROUTES.BOARD.SETTINGS(projectUID));
            },
            active: currentPage === "settings",
            hidden: !canUseSettings || !!selectCardViewType,
        },
    ];

    let pageContent;
    switch (currentPage) {
        case "wiki":
            pageContent = <BoardWikiPage navigate={navigate.current} projectUID={projectUID} currentUser={aboutMe()!} />;
            break;
        case "settings":
            if (canUseSettings) {
                pageContent = <BoardSettingsPage navigate={navigate.current} projectUID={projectUID} currentUser={aboutMe()!} />;
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
        <DashboardStyledLayout
            headerNavs={headerNavs}
            resizableSidebar={resizableSidebar ? { ...resizableSidebar, hidden: !!selectCardViewType } : undefined}
            noPadding
        >
            {isReady ? pageContent : <></>}
        </DashboardStyledLayout>
    );
});

export default BoardProxy;
