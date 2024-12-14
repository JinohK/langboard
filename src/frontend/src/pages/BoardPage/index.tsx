import { memo, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { DashboardStyledLayout } from "@/components/Layout";
import { Toast } from "@/components/base";
import useProjectAvailable from "@/controllers/api/board/useProjectAvailable";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import ChatSidebar from "@/pages/BoardPage/components/chat/ChatSidebar";
import Board, { SkeletonBoard } from "@/pages/BoardPage/components/board/Board";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useBoardChatAvailableHandlers from "@/controllers/socket/board/useBoardChatAvailableHandlers";
import useSocketErrorHandlers from "@/controllers/socket/shared/useSocketErrorHandlers";
import { useSocket } from "@/core/providers/SocketProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import usePageNavigate from "@/core/hooks/usePageNavigate";

const BoardPageProxy = memo((): JSX.Element => {
    const [t] = useTranslation();
    const socket = useSocket();
    const navigate = useRef(usePageNavigate()).current;
    const { aboutMe } = useAuth();
    const projectUID = location.pathname.split("/")[2];
    const isChatAvailableRef = useRef(false);
    const [isReady, setIsReady] = useState(false);

    if (!projectUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const { data: project, error } = useProjectAvailable({ uid: projectUID });

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
        if (!project) {
            return;
        }

        socket.subscribe(ESocketTopic.Board, projectUID);

        const { on: onBoardChatAvailable, send: sendBoardChatAvailable } = useBoardChatAvailableHandlers({
            socket,
            projectUID,
            callback: ({ available }: { available: bool }) => {
                isChatAvailableRef.current = available;
                setIsReady(() => true);
            },
        });
        const { on: onSocketError } = useSocketErrorHandlers({
            socket,
            eventKey: `is-board-chat-available-${projectUID}`,
            callback: () => {
                Toast.Add.error(t("errors.Internal server error"));
                isChatAvailableRef.current = false;
            },
        });

        const { off: offBoardChatAvailable } = onBoardChatAvailable();
        const { off: offSocketError } = onSocketError();

        sendBoardChatAvailable({});

        return () => {
            offBoardChatAvailable();
            offSocketError();
        };
    }, [project]);

    const resizableSidebar =
        isReady && isChatAvailableRef.current
            ? {
                  children: (
                      <Suspense>
                          <ChatSidebar uid={project!.uid} />
                      </Suspense>
                  ),
                  initialWidth: 280,
                  collapsableWidth: 210,
                  floatingIcon: "message-circle",
                  floatingTitle: "project.Chat with AI",
                  floatingFullScreen: true,
              }
            : undefined;

    return (
        <>
            <DashboardStyledLayout headerNavs={[]} resizableSidebar={resizableSidebar} noPadding>
                {!isReady || !aboutMe() ? <SkeletonBoard /> : <Board navigate={navigate} project={project!} currentUser={aboutMe()!} />}
            </DashboardStyledLayout>
        </>
    );
});

export default BoardPageProxy;
