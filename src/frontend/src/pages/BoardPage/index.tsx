import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DashboardStyledLayout } from "@/components/Layout";
import { Progress, Toast } from "@/components/base";
import useProjectAvailable, { IProjectAvailableResponse } from "@/controllers/board/useProjectAvailable";
import { SOCKET_CLIENT_EVENTS, SOCKET_ROUTES, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IConnectedSocket, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import ChatSidebar from "@/pages/BoardPage/components/ChatSidebar";
import Board from "@/pages/BoardPage/components/Board";
import UserAvatarList from "@/components/UserAvatarList";

function BoardPage(): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useProjectAvailable();
    const { connect, closeAll } = useSocket();
    const [socket, setSocket] = useState<IConnectedSocket | null>(null);
    const [project, setProject] = useState<IProjectAvailableResponse["project"] | null>(null);
    const [isChatAvailable, setIsChatAvailable] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const params = useParams();
    const uid = params.uid;
    const isChatAvailableCallback = useCallback((data: { available: bool }) => {
        setIsChatAvailable(data.available);
        setIsReady(true);
    }, []);
    const socketErrorCallback = useCallback(() => {
        Toast.Add.error(t("errors.Internal server error"));
        closeAll();
        setIsChatAvailable(false);
        setSocket(null);
    }, []);

    if (!uid) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    useEffect(() => {
        mutate(
            { uid },
            {
                onSuccess: (data) => {
                    setProject(data.project);
                },
                onError: (error) => {
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
                },
            }
        );
    }, []);

    useEffect(() => {
        if (!project) {
            return;
        }

        const curSocket = connect(SOCKET_ROUTES.BOARD(uid));

        curSocket.on(SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE, isChatAvailableCallback);
        curSocket.on("error", socketErrorCallback);

        setSocket(curSocket);

        curSocket.send(SOCKET_CLIENT_EVENTS.BOARD.IS_CHAT_AVAILABLE, {});

        return () => {
            curSocket.off(SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE, isChatAvailableCallback);
            curSocket.off("error", socketErrorCallback);
            closeAll();
            setSocket(null);
        };
    }, [project]);

    if (!project || !socket || !isReady) {
        return <Progress indeterminate height="1" />;
    }

    const resizableSidebar = {
        children: <ChatSidebar uid={uid} socket={socket} />,
        initialWidth: 280,
        collapsableWidth: 210,
        floatingIcon: "message-circle",
        floatingTitle: "project.Chat with AI",
        floatingFullScreen: true,
    };

    return (
        <DashboardStyledLayout headerNavs={[]} resizableSidebar={isChatAvailable ? resizableSidebar : undefined} noPadding>
            <div className="flex justify-between px-4 pt-4">
                <div className="flex items-center gap-1">
                    <UserAvatarList users={project.members} maxVisible={6} size="default" spacing="3" listAlign="start" />
                </div>
            </div>
            <Board socket={socket} project={project} />
        </DashboardStyledLayout>
    );
}

export default BoardPage;
