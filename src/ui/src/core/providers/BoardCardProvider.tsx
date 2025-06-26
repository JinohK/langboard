import { createContext, useContext, useRef } from "react";
import { AuthUser, Project, ProjectCard } from "@/core/models";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { TUserLikeModel } from "@/core/models/ModelRegistry";

export interface IBoardCardContext {
    projectUID: string;
    card: ProjectCard.TModel;
    currentUser: AuthUser.TModel;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    hasRoleAction: ReturnType<typeof useRoleActionFilter<Project.TRoleActions>>["hasRoleAction"];
    socket: ISocketContext;
    editorsRef: React.RefObject<Record<string, (isEditing: bool) => void>>;
    setCurrentEditor: (uid: string) => void;
    replyRef: React.RefObject<(target: TUserLikeModel) => void>;
    sharedClassNames: {
        popoverContent: string;
    };
}

interface IBoardCardProviderProps {
    projectUID: string;
    card: ProjectCard.TModel;
    currentUser: AuthUser.TModel;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
}

const initialContext = {
    projectUID: "",
    card: {} as ProjectCard.TModel,
    currentUser: {} as AuthUser.TModel,
    viewportRef: { current: null },
    hasRoleAction: () => false,
    socket: {} as ISocketContext,
    editorsRef: { current: {} },
    setCurrentEditor: () => {},
    replyRef: { current: () => {} },
    sharedClassNames: {} as IBoardCardContext["sharedClassNames"],
};

const BoardCardContext = createContext<IBoardCardContext>(initialContext);

export const BoardCardProvider = ({ projectUID, card, currentUser, viewportRef, children }: IBoardCardProviderProps): React.ReactNode => {
    const socket = useSocket();
    const editorsRef = useRef<Record<string, (isEditing: bool) => void>>({});
    const currentEditorRef = useRef<string>("");
    const replyRef = useRef<(target: TUserLikeModel) => void>(() => {});
    const currentUserRoleActions = card.useField("current_auth_role_actions");
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const sharedClassNames = {
        popoverContent: "w-full max-w-[calc(var(--radix-popper-available-width)_-_theme(spacing.10))]",
    };

    const setCurrentEditor = (uid: string) => {
        if (currentEditorRef.current === uid && uid) {
            editorsRef.current[currentEditorRef.current]?.(true);
            return;
        }

        if (currentEditorRef.current) {
            editorsRef.current[currentEditorRef.current]?.(false);
        }

        if (currentEditorRef.current !== uid && uid) {
            editorsRef.current[uid]?.(true);
        }

        currentEditorRef.current = uid;
    };

    return (
        <BoardCardContext.Provider
            value={{
                projectUID,
                card,
                currentUser,
                viewportRef,
                hasRoleAction,
                socket,
                editorsRef,
                setCurrentEditor,
                replyRef,
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
