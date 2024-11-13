import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DashboardStyledLayout } from "@/components/Layout";
import { Progress, Toast } from "@/components/base";
import useProjectAvailable, { IBoardProject } from "@/controllers/board/useProjectAvailable";
import { SOCKET_CLIENT_EVENTS, SOCKET_ROUTES, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { IConnectedSocket, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import ChatSidebar from "@/pages/BoardPage/components/ChatSidebar";
import Board from "@/pages/BoardPage/components/Board";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";

function BoardPageParamChecker(): JSX.Element {
    const params = useParams();
    const uid = params.uid;

    if (!uid) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    return <BoardPageProxy uid={uid} />;
}

function BoardPageProxy({ uid }: { uid: string }): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { connect, closeAll } = useSocket();
    const { data: project, error, isSuccess } = useProjectAvailable({ uid });
    const socketRef = useRef<IConnectedSocket | null>(null);
    const isChatAvailableRef = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const isChatAvailableCallback = useCallback(({ available }: { available: bool }) => {
        isChatAvailableRef.current = available;
        setIsReady(true);
    }, []);
    const socketErrorCallback = useCallback(() => {
        Toast.Add.error(t("errors.Internal server error"));
        closeAll();
        isChatAvailableRef.current = false;
        socketRef.current = null;
    }, []);

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
        if (!isSuccess) {
            return;
        }

        const curSocket = connect(SOCKET_ROUTES.BOARD(uid));

        curSocket.on(SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE, isChatAvailableCallback);
        curSocket.on("error", socketErrorCallback);

        socketRef.current = curSocket;

        curSocket.send(SOCKET_CLIENT_EVENTS.BOARD.IS_CHAT_AVAILABLE, {});

        return () => {
            curSocket.off(SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE, isChatAvailableCallback);
            curSocket.off("error", socketErrorCallback);
            closeAll();
            socketRef.current = null;
        };
    }, [isSuccess]);

    return (
        <>
            {!isReady ? (
                <Progress indeterminate height="1" />
            ) : (
                <BoardPage uid={uid} project={project!} socket={socketRef.current!} isChatAvailable={isChatAvailableRef.current} />
            )}
        </>
    );
}

interface IBoardPageProps {
    uid: string;
    project: IBoardProject;
    socket: IConnectedSocket;
    isChatAvailable: bool;
}

function BoardPage({ uid, project, socket, isChatAvailable }: IBoardPageProps): JSX.Element {
    const resizableSidebar = {
        children: (
            <Suspense>
                <ChatSidebar uid={uid} socket={socket} />
            </Suspense>
        ),
        initialWidth: 280,
        collapsableWidth: 210,
        floatingIcon: "message-circle",
        floatingTitle: "project.Chat with AI",
        floatingFullScreen: true,
    };

    return (
        <DashboardStyledLayout headerNavs={[]} resizableSidebar={isChatAvailable ? resizableSidebar : undefined} noPadding>
            <Suspense>
                <Board socket={socket} project={project} />
            </Suspense>
        </DashboardStyledLayout>
    );
}

export default BoardPageParamChecker;
