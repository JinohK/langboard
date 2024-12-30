import { createContext, useContext, useRef } from "react";
import { AuthUser, Project, ProjectCard, User } from "@/core/models";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import subscribeEditorSocketEvents from "@/core/helpers/subscribeEditorSocketEvents";

export interface IBoardCardContext {
    projectUID: string;
    card: ProjectCard.TModel;
    currentUser: AuthUser.TModel;
    hasRoleAction: (...actions: Project.TRoleActions[]) => bool;
    socket: ISocketContext;
    editorsRef: React.MutableRefObject<Record<string, (isEditing: bool) => void>>;
    setCurrentEditor: (uid: string) => void;
    replyRef: React.MutableRefObject<(targetUser: User.TModel) => void>;
    subscribeEditorSocketEvents: (uid: string, startCallback: (userUIDs: string[]) => void, stopCallback: (userUIDs: string[]) => void) => () => void;
    sharedClassNames: {
        popoverContent: string;
    };
}

interface IBoardCardProviderProps {
    projectUID: string;
    card: ProjectCard.TModel;
    currentUser: AuthUser.TModel;
    currentUserRoleActions: Project.TRoleActions[];
    children: React.ReactNode;
}

const initialContext = {
    projectUID: "",
    card: {} as ProjectCard.TModel,
    currentUser: {} as AuthUser.TModel,
    hasRoleAction: () => false,
    socket: {} as ISocketContext,
    editorsRef: { current: {} },
    setCurrentEditor: () => {},
    replyRef: { current: () => {} },
    subscribeEditorSocketEvents: () => () => {},
    sharedClassNames: {} as IBoardCardContext["sharedClassNames"],
};

const BoardCardContext = createContext<IBoardCardContext>(initialContext);

export const BoardCardProvider = ({ projectUID, card, currentUser, currentUserRoleActions, children }: IBoardCardProviderProps): React.ReactNode => {
    const socket = useSocket();
    const editorsRef = useRef<Record<string, (isEditing: bool) => void>>({});
    const currentEditorRef = useRef<string>("");
    const replyRef = useRef<(targetUser: User.TModel) => void>(() => {});
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const sharedClassNames = {
        popoverContent: "w-full max-w-[calc(var(--radix-popper-available-width)_-_theme(spacing.10))]",
    };

    const setCurrentEditor = (uid: string) => {
        if (currentEditorRef.current) {
            socket.send({
                topic: ESocketTopic.Board,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_STOP_EDITING,
                data: { uid: currentEditorRef.current },
            });
            editorsRef.current[currentEditorRef.current]?.(false);
        }

        if (uid) {
            socket.send({
                topic: ESocketTopic.Board,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.CARD.EDITOR_START_EDITING,
                data: { uid },
            });
            editorsRef.current[uid]?.(true);
        }

        currentEditorRef.current = uid;
    };

    const subscribeEditorSocketAllEvents = (uid: string, startCallback: (userUIDs: string[]) => void, stopCallback: (userUIDs: string[]) => void) => {
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
                editorsRef,
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
