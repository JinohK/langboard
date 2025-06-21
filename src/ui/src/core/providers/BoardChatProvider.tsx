import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ChatMessageModel, InternalBotModel } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import useBoardChatSentHandlers from "@/controllers/socket/board/chat/useBoardChatSentHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useBoardChatStreamHandlers from "@/controllers/socket/board/chat/useBoardChatStreamHandlers";
import { IChatContent } from "@/core/models/Base";
import useTaskAbortedHandlers from "@/controllers/socket/global/useTaskAbortedHandlers";

export interface IBoardChatContext {
    projectUID: string;
    bot: InternalBotModel.TModel;
    socket: ISocketContext;
    isSending: bool;
    setIsSending: React.Dispatch<React.SetStateAction<bool>>;
    isUploading: bool;
    setIsUploading: React.Dispatch<React.SetStateAction<bool>>;
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
    const chatTaskIdRef = useRef<string | null>(null);
    const scrollToBottomRef = useRef<() => void>(() => {});
    const isAtBottomRef = useRef(true);
    const startCallback = useCallback((data: { ai_message: ChatMessageModel.Interface }) => {
        ChatMessageModel.Model.fromObject({ ...data.ai_message, isPending: true }, true);
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
        }

        setIsSending(false);

        if (isAtBottomRef.current) {
            scrollToBottomRef.current();
        }

        chatTaskIdRef.current = null;
    }, []);
    const errorCallback = useCallback((fromServer: bool = true) => {
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

    const sentHandlers = useBoardChatSentHandlers({ projectUID, callback: () => scrollToBottomRef.current() });
    const cancelledHandlers = useMemo(
        () =>
            useTaskAbortedHandlers({
                callback: (data) => {
                    if (data.task_id !== chatTaskIdRef.current) {
                        return;
                    }

                    errorCallback(false);
                },
            }),
        [errorCallback]
    );
    const streamHandlers = useMemo(
        () =>
            useBoardChatStreamHandlers({
                projectUID,
                callbacks: { start: startCallback, buffer: bufferCallback, end: endCallback, error: errorCallback as () => void },
            }),
        [startCallback, bufferCallback, endCallback]
    );
    useSwitchSocketHandlers({
        socket,
        handlers: [sentHandlers, cancelledHandlers, streamHandlers],
        dependencies: [sentHandlers, cancelledHandlers, streamHandlers],
    });

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
