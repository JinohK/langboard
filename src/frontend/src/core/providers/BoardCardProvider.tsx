import { createContext, useContext, useRef, useState } from "react";
import { Project, ProjectCard, User } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { format } from "@/core/utils/StringUtils";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";

export interface IBoardCardContext {
    projectUID: string;
    card: ProjectCard.IBoardWithDetails;
    currentUser: IAuthUser;
    hasRoleAction: (...actions: Project.TRoleActions[]) => bool;
    socket: ISocketContext;
    currentEditor: string;
    setCurrentEditor: (uid: string) => void;
    replyRef: React.MutableRefObject<(targetUser: User.Interface) => void>;
    subscribeEditorSocketEvents: (uid: string, startCallback: (userIds: number[]) => void, stopCallback: (userIds: number[]) => void) => () => void;
    sharedClassNames: {
        popoverContent: string;
    };
}

interface IBoardCardProviderProps {
    projectUID: string;
    card: ProjectCard.IBoardWithDetails;
    currentUser: IAuthUser;
    currentUserRoleActions: Project.TRoleActions[];
    children: React.ReactNode;
}

const initialContext = {
    projectUID: "",
    card: {} as ProjectCard.IBoardWithDetails,
    currentUser: {} as IAuthUser,
    hasRoleAction: () => false,
    socket: {} as ISocketContext,
    currentEditor: "",
    setCurrentEditor: () => {},
    replyRef: { current: () => {} },
    subscribeEditorSocketEvents: () => () => {},
    sharedClassNames: {} as IBoardCardContext["sharedClassNames"],
};

const BoardCardContext = createContext<IBoardCardContext>(initialContext);

export const BoardCardProvider = ({ projectUID, card, currentUser, currentUserRoleActions, children }: IBoardCardProviderProps): React.ReactNode => {
    const socket = useSocket();
    const [currentEditor, setCurEditor] = useState<string>("");
    const replyRef = useRef<(targetUser: User.Interface) => void>(() => {});
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const sharedClassNames = {
        popoverContent: "w-full max-w-[calc(var(--radix-popper-available-width)_-_theme(spacing.10))]",
    };

    const setCurrentEditor = (uid: string) => {
        if (currentEditor) {
            socket.send({
                topic: ESocketTopic.Board,
                id: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_STOP_EDITING,
                data: { uid: currentEditor },
            });
        }

        if (uid) {
            socket.send({
                topic: ESocketTopic.Board,
                id: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_START_EDITING,
                data: { uid },
            });
        }

        setCurEditor(uid);
    };

    const subscribeEditorSocketEvents = (uid: string, startCallback: (userIds: number[]) => void, stopCallback: (userIds: number[]) => void) => {
        const getUsersEditingEvent = format(SOCKET_SERVER_EVENTS.BOARD.CARD.EDITOR_USERS, { uid });
        const startedEditingEvent = format(SOCKET_SERVER_EVENTS.BOARD.CARD.EDITOR_START_EDITING, { uid });
        const stoppedEditingEvent = format(SOCKET_SERVER_EVENTS.BOARD.CARD.EDITOR_STOP_EDITING, { uid });

        const events: [string, (data: { user_ids: number[] }) => void][] = [
            [
                getUsersEditingEvent,
                (data: { user_ids: number[] }) => {
                    startCallback(data.user_ids);
                    socket.off({
                        topic: ESocketTopic.Board,
                        id: projectUID,
                        eventKey: `board-card-editor-${getUsersEditingEvent}-${uid}`,
                        event: getUsersEditingEvent,
                        callback: events[0][1],
                    });
                    events.shift();
                },
            ],
            [
                startedEditingEvent,
                (data: { user_ids: number[] }) => {
                    startCallback(data.user_ids);
                },
            ],
            [
                stoppedEditingEvent,
                (data: { user_ids: number[] }) => {
                    stopCallback(data.user_ids);
                },
            ],
        ];

        events.forEach(([event, handler]) => {
            socket.on({
                topic: ESocketTopic.Board,
                id: projectUID,
                eventKey: `board-card-editor-${event}-${uid}`,
                event: event,
                callback: handler,
            });
        });

        socket.send({
            topic: ESocketTopic.Board,
            id: projectUID,
            eventName: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_USERS,
            data: { uid },
        });

        return () => {
            events.forEach(([event, handler]) => {
                socket.off({
                    topic: ESocketTopic.Board,
                    id: projectUID,
                    eventKey: `board-card-editor-${event}-${uid}`,
                    event,
                    callback: handler,
                });
            });
        };
    };

    return (
        <BoardCardContext.Provider
            value={{
                projectUID,
                card,
                currentUser,
                hasRoleAction,
                socket,
                currentEditor,
                setCurrentEditor,
                replyRef,
                subscribeEditorSocketEvents,
                sharedClassNames,
            }}
        >
            {children}
        </BoardCardContext.Provider>
    );
};

export const useBoardCard = () => {
    const context = useContext(BoardCardContext);
    if (!context) {
        throw new Error("useBoardCard must be used within a BoardCardProvider");
    }
    return context;
};
