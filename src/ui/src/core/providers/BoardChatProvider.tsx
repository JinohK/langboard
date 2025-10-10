import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessageModel, ChatSessionModel, InternalBotModel } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import useBoardChatSentHandlers from "@/controllers/socket/board/chat/useBoardChatSentHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useBoardChatStreamHandlers from "@/controllers/socket/board/chat/useBoardChatStreamHandlers";
import { IChatContent } from "@/core/models/Base";
import useTaskAbortedHandlers from "@/controllers/socket/global/useTaskAbortedHandlers";
import useGetProjectChatSessions from "@/controllers/api/board/chat/useGetProjectChatSessions";
import useBoardChatSessionCreatedHandlers from "@/controllers/socket/board/chat/useBoardChatSessionCreatedHandlers";

export interface IBoardChatContext {
    projectUID: string;
    bot: InternalBotModel.TModel;
    socket: ISocketContext;
    isSending: bool;
    setIsSending: React.Dispatch<React.SetStateAction<bool>>;
    isUploading: bool;
    setIsUploading: React.Dispatch<React.SetStateAction<bool>>;
    isSessionListOpened: bool;
    setIsSessionListOpened: React.Dispatch<React.SetStateAction<bool>>;
    chatSessions: ChatSessionModel.TModel[];
    currentSessionUID?: string;
    setCurrentSessionUID: React.Dispatch<React.SetStateAction<string | undefined>>;
    chatTaskIdRef: React.RefObject<string | null>;
    scrollToBottomRef: React.RefObject<() => void>;
    isAtBottomRef: React.RefObject<bool>;
}

interface IBoardChatProviderProps {
    projectUID: string;
    bot: InternalBotModel.TModel;
    children: React.ReactNode;
}

const initialContext = {
    projectUID: "",
    bot: {} as InternalBotModel.TModel,
    socket: {} as ISocketContext,
    isSending: false,
    setIsSending: () => {},
    isUploading: false,
    setIsUploading: () => {},
    isSessionListOpened: false,
    setIsSessionListOpened: () => {},
    chatSessions: [],
    currentSessionUID: undefined,
    setCurrentSessionUID: () => {},
    chatTaskIdRef: { current: null },
    scrollToBottomRef: { current: () => {} },
    isAtBottomRef: { current: true },
};

const BoardChatContext = createContext<IBoardChatContext>(initialContext);

export const BoardChatProvider = ({ projectUID, bot, children }: IBoardChatProviderProps): React.ReactNode => {
    const socket = useSocket();
    const [t] = useTranslation();
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSessionListOpened, setIsSessionListOpened] = useState(false);
    const chatTaskIdRef = useRef<string | null>(null);
    const scrollToBottomRef = useRef<() => void>(() => {});
    const isAtBottomRef = useRef(true);
    const flatChatSessions = ChatSessionModel.Model.useModels(
        (model) => model.filterable_table === "project" && model.filterable_uid === projectUID,
        [projectUID]
    );
    const chatSessions = useMemo(
        () => flatChatSessions.sort((a, b) => (b.last_messaged_at?.getTime() ?? 0) - (a.last_messaged_at?.getTime() ?? 0)),
        [flatChatSessions]
    );
    const { mutateAsync } = useGetProjectChatSessions(projectUID);
    const isInitialMountedRef = useRef(false);
    const [currentSessionUID, setCurrentSessionUID] = useState<string | undefined>(chatSessions[0]?.uid);
    const startCallback = useCallback((data: { ai_message: ChatMessageModel.Interface }) => {
        const chatMessage = ChatMessageModel.Model.fromOne({ ...data.ai_message, isPending: true }, true);
        const chatSession = ChatSessionModel.Model.getModel((model) => model.uid === chatMessage.chat_session_uid);
        if (chatSession) {
            chatSession.last_messaged_at = chatMessage.updated_at;
        }
        scrollToBottomRef.current();
    }, []);
    const bufferCallback = useCallback((data: { uid: string; message?: IChatContent; chunk?: string }) => {
        const chatMessage = ChatMessageModel.Model.getModel(data.uid);
        if (!chatMessage) {
            return;
        }

        if (data.message) {
            if (data.message.content && chatMessage.isPending) {
                chatMessage.isPending = undefined;
            }

            chatMessage.message = data.message;
        } else if (data.chunk) {
            if (!chatMessage.message || !chatMessage.message.content) {
                chatMessage.message = { content: "" };
            }

            if (data.chunk && chatMessage.isPending) {
                chatMessage.isPending = undefined;
            }

            const message = {
                content: `${chatMessage.message.content}${data.chunk}`,
            };

            chatMessage.message = message;

            if (isAtBottomRef.current) {
                scrollToBottomRef.current();
            }
        }
    }, []);
    const endCallback = useCallback((data: { uid: string; status: "success" | "failed" | "aborted" }) => {
        const chatMessage = ChatMessageModel.Model.getModel(data.uid);
        const chatSession = chatMessage ? ChatSessionModel.Model.getModel((model) => model.uid === chatMessage.chat_session_uid) : undefined;
        if (data.status === "failed") {
            Toast.Add.error(t("errors.Server has been temporarily disabled. Please try again later."));
        }

        if (data.status !== "success") {
            if (data.status === "failed") {
                ChatMessageModel.Model.deleteModel(data.uid);
            }
        }

        if (chatMessage && chatMessage.isPending) {
            chatMessage.isPending = undefined;
            if (chatSession) {
                chatSession.last_messaged_at = chatMessage.updated_at;
            }
        }

        setIsSending(false);

        if (isAtBottomRef.current) {
            scrollToBottomRef.current();
        }

        chatTaskIdRef.current = null;
    }, []);
    const errorCallback = useCallback((_: Event, fromServer: bool = true) => {
        ChatMessageModel.Model.getModels((model) => model.isPending ?? false).forEach((message) => {
            if (message.isPending) {
                message.isPending = undefined;
            }
        });
        setIsSending(false);
        if ((isSending || isUploading) && fromServer) {
            Toast.Add.error(t("errors.Server has been temporarily disabled. Please try again later."));
        }

        chatTaskIdRef.current = null;
    }, []);
    const sessionCreatedHandlers = useMemo(
        () =>
            useBoardChatSessionCreatedHandlers({
                projectUID,
                callback: (data) => {
                    if (!currentSessionUID) {
                        setCurrentSessionUID(data.session.uid);
                    }
                },
            }),
        [currentSessionUID, setCurrentSessionUID]
    );
    const sentHandlers = useBoardChatSentHandlers({ projectUID, callback: () => scrollToBottomRef.current() });
    const cancelledHandlers = useMemo(
        () =>
            useTaskAbortedHandlers({
                callback: (data) => {
                    if (data.task_id !== chatTaskIdRef.current) {
                        return;
                    }

                    errorCallback({} as Event, false);
                },
            }),
        [errorCallback]
    );
    const streamHandlers = useMemo(
        () =>
            useBoardChatStreamHandlers({
                projectUID,
                callbacks: { start: startCallback, buffer: bufferCallback, end: endCallback, error: errorCallback },
            }),
        [startCallback, bufferCallback, endCallback]
    );
    useSwitchSocketHandlers({
        socket,
        handlers: [sessionCreatedHandlers, sentHandlers, cancelledHandlers, streamHandlers],
        dependencies: [sessionCreatedHandlers, sentHandlers, cancelledHandlers, streamHandlers],
    });

    useEffect(() => {
        mutateAsync({});
    }, [projectUID]);

    useEffect(() => {
        if (isInitialMountedRef.current || !chatSessions.length) {
            return;
        }

        if (!currentSessionUID) {
            setCurrentSessionUID(chatSessions[0].uid);
        }

        isInitialMountedRef.current = true;
    }, [flatChatSessions]);

    return (
        <BoardChatContext.Provider
            value={{
                projectUID,
                bot,
                socket,
                isSending,
                setIsSending,
                isUploading,
                setIsUploading,
                isSessionListOpened,
                setIsSessionListOpened,
                chatSessions,
                currentSessionUID,
                setCurrentSessionUID,
                chatTaskIdRef,
                scrollToBottomRef,
                isAtBottomRef,
            }}
        >
            {children}
        </BoardChatContext.Provider>
    );
};

export const useBoardChat = () => {
    const context = useContext(BoardChatContext);
    if (!context) {
        throw new Error("useBoardChat must be used within a BoardChatProvider");
    }
    return context;
};
