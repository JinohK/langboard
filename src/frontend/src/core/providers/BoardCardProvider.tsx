import { createContext, useContext, useRef, useState } from "react";
import { Project, User } from "@/core/models";
import { IBoardCardWithDetails } from "@/controllers/board/useGetCardDetails";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { format } from "@/core/utils/StringUtils";

export interface IBoardCardContext {
    projectUID: string;
    card: IBoardCardWithDetails;
    currentUser: IAuthUser;
    currentUserRoleActions: Project.TRoleActions[];
    socket: IConnectedSocket;
    currentEditor: string;
    setCurrentEditor: (uid: string) => void;
    replyRef: React.MutableRefObject<(targetUser: User.Interface) => void>;
    subscribeEditorSocketEvents: (uid: string, startCallback: (userIds: number[]) => void, stopCallback: (userIds: number[]) => void) => () => void;
}

interface IBoardCardProviderProps {
    projectUID: string;
    card: IBoardCardWithDetails;
    currentUser: IAuthUser;
    currentUserRoleActions: Project.TRoleActions[];
    socket: IConnectedSocket;
    children: React.ReactNode;
}

const initialContext = {
    projectUID: "",
    card: {} as IBoardCardWithDetails,
    currentUser: {} as IAuthUser,
    currentUserRoleActions: [],
    socket: {} as IConnectedSocket,
    currentEditor: "",
    setCurrentEditor: () => {},
    replyRef: { current: () => {} },
    subscribeEditorSocketEvents: () => () => {},
};

const BoardCardContext = createContext<IBoardCardContext>(initialContext);

export const BoardCardProvider = ({
    projectUID,
    card,
    currentUser,
    currentUserRoleActions,
    socket,
    children,
}: IBoardCardProviderProps): React.ReactNode => {
    const [currentEditor, setCurEditor] = useState<string>("");
    const replyRef = useRef<(targetUser: User.Interface) => void>(() => {});

    const setCurrentEditor = (uid: string) => {
        if (currentEditor) {
            socket.send(SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_STOP_EDITING, { uid: currentEditor });
        }

        if (uid) {
            socket.send(SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_START_EDITING, { uid });
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
                    socket.off(getUsersEditingEvent, events[0][1]);
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
            socket.on(event, handler);
        });

        socket.send(SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_USERS, { uid });

        return () => {
            events.forEach(([event, handler]) => {
                socket.off(event, handler);
            });
        };
    };

    return (
        <BoardCardContext.Provider
            value={{
                projectUID,
                card,
                currentUser,
                currentUserRoleActions,
                socket,
                currentEditor,
                setCurrentEditor,
                replyRef,
                subscribeEditorSocketEvents,
            }}
        >
            {children}
        </BoardCardContext.Provider>
    );
};

export const useBoardCard = () => {
    const context = useContext(BoardCardContext);
    if (!context) {
        throw new Error("useBoardCard must be used within an BoardCardProvider");
    }
    return context;
};
