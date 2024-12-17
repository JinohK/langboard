import { Toast } from "@/components/base";
import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ProjectWiki, User } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { createContext, useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavigateFunction } from "react-router-dom";

export interface IBoardWikiContext {
    navigate: NavigateFunction;
    projectUID: string;
    socket: ISocketContext;
    wikis: ProjectWiki.Interface[];
    setWikis: React.Dispatch<React.SetStateAction<ProjectWiki.Interface[]>>;
    projectMembers: User.Interface[];
    currentUser: IAuthUser;
    currentEditor: string;
    setCurrentEditor: (uid: string) => void;
    canAccessWiki: (shouldNavigate: boolean, uid?: string) => boolean;
    setTitleMapRef: React.MutableRefObject<Record<string, (title: string) => void>>;
}

interface IBoardWikiProps {
    navigate: NavigateFunction;
    projectUID: string;
    wikis: ProjectWiki.Interface[];
    projectMembers: User.Interface[];
    currentUser: IAuthUser;
    children: React.ReactNode;
}

const initialContext = {
    navigate: () => {},
    projectUID: "",
    socket: {} as ISocketContext,
    wikis: [],
    setWikis: () => {},
    projectMembers: [],
    currentUser: {} as IAuthUser,
    currentEditor: "",
    setCurrentEditor: () => {},
    canAccessWiki: () => false,
    setTitleMapRef: { current: {} },
};

const BoardWikiContext = createContext<IBoardWikiContext>(initialContext);

export const BoardWikiProvider = ({
    navigate,
    projectUID,
    wikis: flatWikis,
    projectMembers,
    currentUser,
    children,
}: IBoardWikiProps): React.ReactNode => {
    const socket = useSocket();
    const [wikis, setWikis] = useState<ProjectWiki.Interface[]>(flatWikis);
    const [t] = useTranslation();
    const [currentEditor, setCurEditor] = useState<string>("");
    const setTitleMapRef = useRef<Record<string, (title: string) => void>>({});

    const setCurrentEditor = (uid: string) => {
        if (currentEditor) {
            socket.send({
                topic: ESocketTopic.BoardWiki,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.WIKI.EDITOR_STOP_EDITING,
                data: { uid: currentEditor },
            });
        }

        if (uid) {
            socket.send({
                topic: ESocketTopic.BoardWiki,
                topicId: projectUID,
                eventName: SOCKET_CLIENT_EVENTS.BOARD.WIKI.EDITOR_START_EDITING,
                data: { uid },
            });
        }

        setCurEditor(uid);
    };

    const canAccessWiki = (shouldNavigate: bool, uid?: string) => {
        if (!uid) {
            return true;
        }

        const wiki = wikis.find((wiki) => wiki.uid === uid);
        if (!wiki || wiki.forbidden) {
            if (shouldNavigate) {
                Toast.Add.error(t("wiki.Can't access this wiki."));
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
                currentEditor,
                setCurrentEditor,
                canAccessWiki,
                setTitleMapRef,
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
