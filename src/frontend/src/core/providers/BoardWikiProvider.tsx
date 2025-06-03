import { Toast } from "@/components/base";
import useBoardWikiCreatedHandlers from "@/controllers/socket/wiki/useBoardWikiCreatedHandlers";
import useBoardWikiProjectBotsUpdatedHandlers from "@/controllers/socket/wiki/useBoardWikiProjectBotsUpdatedHandlers";
import useBoardWikiProjectUsersUpdatedHandlers from "@/controllers/socket/wiki/useBoardWikiProjectUsersUpdatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { AuthUser, BotModel, ProjectWiki, User } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavigateFunction } from "react-router-dom";

export type TBoardWikiMode = "reorder" | "delete" | "view";

export interface IBoardWikiContext {
    navigate: NavigateFunction;
    projectUID: string;
    socket: ISocketContext;
    wikis: ProjectWiki.TModel[];
    setWikis: React.Dispatch<React.SetStateAction<ProjectWiki.TModel[]>>;
    projectMembers: User.TModel[];
    projectBots: BotModel.TModel[];
    currentUser: AuthUser.TModel;
    editorsRef: React.RefObject<Record<string, (isEditing: bool) => void>>;
    setCurrentEditor: (uid: string) => void;
    canAccessWiki: (shouldNavigate: bool, uid?: string) => bool;
    modeType: TBoardWikiMode;
    setModeType: React.Dispatch<React.SetStateAction<TBoardWikiMode>>;
    wikiTabListId: string;
}

interface IBoardWikiProps {
    navigate: NavigateFunction;
    projectUID: string;
    projectMembers: User.TModel[];
    projectBots: BotModel.TModel[];
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
    projectBots: [],
    currentUser: {} as AuthUser.TModel,
    editorsRef: { current: {} },
    setCurrentEditor: () => {},
    canAccessWiki: () => false,
    modeType: "view" as TBoardWikiMode,
    setModeType: () => {},
    wikiTabListId: "",
};

const BoardWikiContext = createContext<IBoardWikiContext>(initialContext);

export const BoardWikiProvider = ({
    navigate,
    projectUID,
    projectMembers: flatProjectMembers,
    projectBots: flatProjectBots,
    currentUser,
    children,
}: IBoardWikiProps): React.ReactNode => {
    const socket = useSocket();
    const flatWikis = ProjectWiki.Model.useModels((model) => model.project_uid === projectUID);
    const [wikis, setWikis] = useState<ProjectWiki.TModel[]>(flatWikis.sort((a, b) => a.order - b.order));
    const [projectMembers, setProjectMembers] = useState(flatProjectMembers);
    const [projectBots, setProjectBots] = useState(flatProjectBots);
    const [t] = useTranslation();
    const editorsRef = useRef<Record<string, (isEditing: bool) => void>>({});
    const currentEditorRef = useRef("");
    const [modeType, setModeType] = useState<TBoardWikiMode>("view");
    const wikiTabListId = `board-wiki-tab-list-${projectUID}`;
    const boardWikiCreatedHandlers = useBoardWikiCreatedHandlers({
        projectUID,
    });
    const projectBotsUpdatedHandlers = useMemo(
        () =>
            useBoardWikiProjectBotsUpdatedHandlers({
                projectUID,
                callback: (data) => {
                    setProjectBots(() => data.assigned_bots);
                },
            }),
        [setProjectBots]
    );
    const projectUsersUpdatedHandlers = useMemo(
        () =>
            useBoardWikiProjectUsersUpdatedHandlers({
                projectUID,
                callback: (data) => {
                    setProjectMembers(() => data.assigned_members);
                },
            }),
        [setProjectMembers]
    );

    useSwitchSocketHandlers({
        socket,
        handlers: [boardWikiCreatedHandlers, projectBotsUpdatedHandlers, projectUsersUpdatedHandlers],
        dependencies: [projectBotsUpdatedHandlers, projectUsersUpdatedHandlers],
    });

    useEffect(() => {
        setWikis(() => flatWikis.sort((a, b) => a.order - b.order));

        const unsubscribes: (() => void)[] = [];
        for (let i = 0; i < flatWikis.length; ++i) {
            const wiki = flatWikis[i];
            const unsubscribe = wiki.subscribePrivateSocketHandlers(currentUser);
            unsubscribes.push(unsubscribe);
        }

        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    }, [flatWikis]);

    const setCurrentEditor = (uid: string) => {
        if (currentEditorRef.current) {
            editorsRef.current[currentEditorRef.current]?.(false);
        }

        if (uid) {
            editorsRef.current[uid]?.(true);
        }

        currentEditorRef.current = uid;
    };

    const canAccessWiki = (shouldNavigate: bool, uid?: string) => {
        if (!uid) {
            return true;
        }

        const wiki = ProjectWiki.Model.getModel(uid);
        if (!wiki || wiki.project_uid !== projectUID || wiki.forbidden) {
            if (shouldNavigate) {
                Toast.Add.error(t("errors.requests.PE2006"));
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
                projectBots,
                currentUser,
                editorsRef,
                setCurrentEditor,
                canAccessWiki,
                modeType,
                setModeType,
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
