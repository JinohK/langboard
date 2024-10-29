import { Progress, Toast } from "@/components/base";
import { DashboardStyledLayout } from "@/components/Layout";
import useProjectAvailable from "@/controllers/board/useProjectAvailable";
import { SOCKET_CLIENT_EVENTS, SOCKET_ROUTES, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IConnectedSocket, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import ChatSidebar from "@/pages/BoardPage/components/ChatSidebar";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

function BoardPage(): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate } = useProjectAvailable();
    const { connect, closeAll } = useSocket();
    const [socket, setSocket] = useState<IConnectedSocket | null>(null);
    const [isConnectable, setIsConnectable] = useState(false);
    const [isChatAvailable, setIsChatAvailable] = useState(false);
    const params = useParams();
    const uid = params.uid;
    const isChatAvailableCallback = useCallback((data: { available: boolean }) => {
        setIsChatAvailable(data.available);
    }, []);
    const chatErrorCallback = useCallback(() => {
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
                onSuccess: () => {
                    setIsConnectable(true);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                    });

                    handle(error);
                },
            }
        );
    }, []);

    useEffect(() => {
        if (!isConnectable) {
            return;
        }

        const curSocket = connect(SOCKET_ROUTES.BOARD(uid));

        curSocket.on(SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE, isChatAvailableCallback);
        curSocket.on("error", chatErrorCallback);

        setSocket(curSocket);

        curSocket.send(SOCKET_CLIENT_EVENTS.BOARD.IS_CHAT_AVAILABLE, {});

        return () => {
            curSocket.off(SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE, isChatAvailableCallback);
            curSocket.off("error", chatErrorCallback);
            closeAll();
            setSocket(null);
        };
    }, [isConnectable]);

    if (!isConnectable || !socket) {
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
        <DashboardStyledLayout headerNavs={[]} resizableSidebar={isChatAvailable ? resizableSidebar : undefined}>
            <div>board</div>
        </DashboardStyledLayout>
    );
}

export default BoardPage;
