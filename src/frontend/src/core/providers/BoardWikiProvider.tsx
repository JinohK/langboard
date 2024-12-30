import { Toast } from "@/components/base";
import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { AuthUser, ProjectWiki, User } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavigateFunction } from "react-router-dom";

export interface IBoardWikiContext {
    navigate: NavigateFunction;
    projectUID: string;
    socket: ISocketContext;
    wikis: ProjectWiki.TModel[];
    setWikis: React.Dispatch<React.SetStateAction<ProjectWiki.TModel[]>>;
    projectMembers: User.TModel[];
    currentUser: AuthUser.TModel;
    editorsRef: React.MutableRefObject<Record<string, (isEditing: bool) => void>>;
    setCurrentEditor: (uid: string) => void;
    canAccessWiki: (shouldNavigate: bool, uid?: string) => bool;
    disabledReorder: bool;
    setDisabledReorder: React.Dispatch<React.SetStateAction<bool>>;
    wikiTabListId: string;
}

interface IBoardWikiProps {
    navigate: NavigateFunction;
    projectUID: string;
    projectMembers: User.TModel[];
    currentUser: AuthUser.TModel;
    children: React.ReactNode;
}

const initialContext = {
    navigate: () => {},
    projectUID: "",
    socket: {} as ISocketContext,
    wikis: [],
    setWikis: () => {},
    projectMembers: [],
    currentUser: {} as AuthUser.TModel,
    editorsRef: { current: {} },
    setCurrentEditor: () => {},
    canAccessWiki: () => false,
    disabledReorder: true,
    setDisabledReorder: () => {},
    wikiTabListId: "",
};

const BoardWikiContext = createContext<IBoardWikiContext>(initialContext);

export const BoardWikiProvider = ({ navigate, projectUID, projectMembers, currentUser, children }: IBoardWikiProps): React.ReactNode => {
    const socket = useSocket();
    const flatWikis = ProjectWiki.Model.useModels((model) => model.project_uid === projectUID);
    const [wikis, setWikis] = useState<ProjectWiki.TModel[]>(flatWikis.sort((a, b) => a.order - b.order));
    const [t] = useTranslation();
    const editorsRef = useRef<Record<string, (isEditing: bool) => void>>({});
    const currentEditorRef = useRef<string>("");
    const [disabledReorder, setDisabledReorder] = useState<bool>(true);
    const wikiTabListId = `board-wiki-tab-list-${projectUID}`;

    useEffect(() => {
        setWikis(flatWikis.sort((a, b) => a.order - b.order));

        const unsubscribes: (() => void)[] = [];
        for (let i = 0; i < wikis.length; ++i) {
            const wiki = wikis[i];
            const unsubscribe = wiki.subscribePrivateSocketHandlers(currentUser.uid);
            unsubscribes.push(unsubscribe);
        }

        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    }, [flatWikis]);

    const setCurrentEditor = (uid: string) => {
        if (currentEditorRef.current) {
            socket.send({
                topic: ESocketTopic.BoardWiki,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.WIKI.EDITOR_STOP_EDITING,
                data: { uid: currentEditorRef.current },
            });
            editorsRef.current[currentEditorRef.current]?.(false);
        }

        if (uid) {
            socket.send({
                topic: ESocketTopic.BoardWiki,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.WIKI.EDITOR_START_EDITING,
                data: { uid },
            });
            editorsRef.current[uid]?.(true);
        }

        currentEditorRef.current = uid;
    };

    const canAccessWiki = (shouldNavigate: bool, uid?: string) => {
        if (!uid) {
            return true;
        }

        const wiki = wikis.find((wiki) => wiki.uid === uid);
        if (!wiki || wiki.forbidden) {
            if (shouldNavigate) {
                Toast.Add.error(t("wiki.errors.Can't access this wiki."));
                setCurrentEditor("");
                navigate(ROUTES.BOARD.WIKI(projectUID));
            }
            return false;
        }

        return true;
    };

    return (
        <BoardWikiContext.Provider
            value={{
                navigate,
                projectUID,
                socket,
                wikis,
                setWikis,
                projectMembers,
                currentUser,
                editorsRef,
                setCurrentEditor,
                canAccessWiki,
                disabledReorder,
                setDisabledReorder,
                wikiTabListId,
            }}
        >
            {children}
        </BoardWikiContext.Provider>
    );
};

export const useBoardWiki = () => {
    const context = useContext(BoardWikiContext);
    if (!context) {
        throw new Error("useBoardWiki must be used within a BoardWikiProvider");
    }
    return context;
};
