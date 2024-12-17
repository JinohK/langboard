import { createContext, useContext, useRef, useState } from "react";
import { Project, ProjectCard, User } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import subscribeEditorSocketEvents from "@/core/helpers/subscribeEditorSocketEvents";

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
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_STOP_EDITING,
                data: { uid: currentEditor },
            });
        }

        if (uid) {
            socket.send({
                topic: ESocketTopic.Board,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_START_EDITING,
                data: { uid },
            });
        }

        setCurEditor(uid);
    };

    const subscribeEditorSocketAllEvents = (uid: string, startCallback: (userIds: number[]) => void, stopCallback: (userIds: number[]) => void) => {
        return subscribeEditorSocketEvents({
            socket,
            topic: ESocketTopic.Board,
            topicId: projectUID,
            onEventNames: SOCKET_SERVER_EVENTS.BOARD.CARD,
            eventNameFormatMap: { uid },
            eventKey: `board-card-editor-${uid}`,
            getUsersSendEvent: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_USERS,
            getUsersSendEventData: { uid },
            startCallback,
            stopCallback,
        });
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
                subscribeEditorSocketEvents: subscribeEditorSocketAllEvents,
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
