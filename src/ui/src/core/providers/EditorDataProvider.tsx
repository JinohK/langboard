/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useMemo } from "react";
import { AuthUser } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { Routing } from "@langboard/core/constants";
import { TUserLikeModel } from "@/core/models/ModelRegistry";

export type TEditorType = "view" | "card-description" | "card-comment" | "card-new-comment" | "wiki-content";

export interface IEditorDataContext {
    currentUser: AuthUser.TModel;
    mentionables: TUserLikeModel[];
    form?: any;
    socketEvents?: ReturnType<typeof createEditorSocketEvents>;
    chatEventKey?: string;
    copilotEventKey?: string;
    commonSocketEventData?: Record<string, any>;
    uploadPath?: string;
    uploadedCallback?: (respones: any) => void;
}

interface IBaseEditorDataProviderProps {
    currentUser: AuthUser.TModel;
    mentionables: TUserLikeModel[];
    editorType: TEditorType;
    form?: any;
    uploadedCallback?: (respones: any) => void;
    children: React.ReactNode;
}

interface IViewEditorDataProviderProps extends IBaseEditorDataProviderProps {
    editorType: "view";
    form?: {
        project_uid?: string;
    };
}

interface ICardDescriptionEditorDataProviderProps extends IBaseEditorDataProviderProps {
    editorType: "card-description";
    form: {
        project_uid: string;
        card_uid: string;
    };
}

interface ICardCommentEditorDataProviderProps extends IBaseEditorDataProviderProps {
    editorType: "card-comment";
    form: {
        project_uid: string;
        card_uid: string;
        comment_uid: string;
    };
}

interface ICardNewCommentEditorDataProviderProps extends IBaseEditorDataProviderProps {
    editorType: "card-new-comment";
    form: {
        project_uid: string;
        card_uid: string;
    };
}

interface IWikiContentEditorDataProviderProps extends IBaseEditorDataProviderProps {
    editorType: "wiki-content";
    form: {
        project_uid: string;
        wiki_uid: string;
    };
}

export type TEditorDataProviderProps =
    | IViewEditorDataProviderProps
    | ICardDescriptionEditorDataProviderProps
    | ICardCommentEditorDataProviderProps
    | ICardNewCommentEditorDataProviderProps
    | IWikiContentEditorDataProviderProps;

const initialContext = {
    currentUser: {} as AuthUser.TModel,
    mentionables: [],
};

const EditorDataContext = createContext<IEditorDataContext>(initialContext);

const createEditorSocketEvents = (baseEvent: string) => ({
    chatEvents: {
        abort: `${baseEvent}:editor:chat:abort`,
        send: `${baseEvent}:editor:chat:send`,
        stream: `${baseEvent}:editor:chat:stream`,
    },
    copilotEvents: {
        abort: `${baseEvent}:editor:copilot:abort`,
        send: `${baseEvent}:editor:copilot:send`,
        receive: `${baseEvent}:editor:copilot:receive`,
    },
});

export const EditorDataProvider = ({
    currentUser,
    mentionables,
    editorType,
    form,
    uploadedCallback,
    children,
}: TEditorDataProviderProps): React.ReactNode => {
    const [baseSocketEvent, chatEventKey, copilotEventKey] = useMemo(() => {
        switch (editorType) {
            case "card-description":
                return ["board:card", `card-description-chat-${form.card_uid}`, `card-description-copilot-${form.card_uid}`];
            case "card-comment":
                return ["board:card", `card-comment-chat-${form.comment_uid}`, `card-comment-copilot-${form.comment_uid}`];
            case "card-new-comment":
                return ["board:card", `card-new-comment-chat-${form.card_uid}`, `card-new-comment-copilot-${form.card_uid}`];
            case "wiki-content":
                return ["board:wiki", `wiki-content-chat-${form.wiki_uid}`, `wiki-content-copilot-${form.wiki_uid}`];
            default:
                return [undefined, undefined, undefined];
        }
    }, [editorType, form]);
    const socketEvents = useMemo(() => {
        if (baseSocketEvent) {
            return createEditorSocketEvents(baseSocketEvent);
        } else {
            return undefined;
        }
    }, [baseSocketEvent]);
    const uploadPath = useMemo(() => {
        switch (editorType) {
            case "card-description":
                return Utils.String.format(Routing.API.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: form.project_uid, card_uid: form.card_uid });
            case "card-comment":
                return Utils.String.format(Routing.API.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: form.project_uid, card_uid: form.card_uid });
            case "card-new-comment":
                return Utils.String.format(Routing.API.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: form.project_uid, card_uid: form.card_uid });
            case "wiki-content":
                return Utils.String.format(Routing.API.BOARD.WIKI.UPLOAD, { uid: form.project_uid, wiki_uid: form.wiki_uid });
            default:
        }
    }, [editorType, form]);

    return (
        <EditorDataContext.Provider
            value={{
                currentUser,
                mentionables,
                form,
                socketEvents,
                chatEventKey,
                copilotEventKey,
                commonSocketEventData: form,
                uploadPath,
                uploadedCallback,
            }}
        >
            {children}
        </EditorDataContext.Provider>
    );
};

export const useEditorData = () => {
    const context = useContext(EditorDataContext);
    if (!context) {
        throw new Error("useEditorData must be used within a EditorDataProvider");
    }
    return context;
};
