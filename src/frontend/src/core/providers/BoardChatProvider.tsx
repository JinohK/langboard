import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ChatMessageModel, InternalBotModel } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import useBoardChatSentHandlers from "@/controllers/socket/board/useBoardChatSentHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useBoardChatStreamHandlers from "@/controllers/socket/board/useBoardChatStreamHandlers";
import useBoardChatCancelHandlers from "@/controllers/socket/board/useBoardChatCancelHandlers";
import { IChatContent } from "@/core/models/Base";

export interface IBoardChatContext {
    projectUID: string;
    bot: InternalBotModel.Interface;
    socket: ISocketContext;
    isSending: bool;
    setIsSending: React.Dispatch<React.SetStateAction<bool>>;
    scrollToBottomRef: React.RefObject<() => void>;
}

interface IBoardChatProviderProps {
    projectUID: string;
    bot: InternalBotModel.Interface;
    children: React.ReactNode;
}

const initialContext = {
    projectUID: "",
    bot: {} as InternalBotModel.Interface,
    socket: {} as ISocketContext,
    isSending: false,
    setIsSending: () => {},
    scrollToBottomRef: { current: () => {} },
};

const BoardChatContext = createContext<IBoardChatContext>(initialContext);

export const BoardChatProvider = ({ projectUID, bot, children }: IBoardChatProviderProps): React.ReactNode => {
    const socket = useSocket();
    const [t] = useTranslation();
    const [isSending, setIsSending] = useState(false);
    const scrollToBottomRef = useRef<() => void>(() => {});
    const startCallback = useCallback((data: { ai_message: ChatMessageModel.Interface }) => {
        data.ai_message.projectUID = projectUID;
        ChatMessageModel.Model.fromObject({ ...data.ai_message, isPending: true }, true);
        scrollToBottomRef.current();
    }, []);
    const bufferCallback = useCallback((data: { uid: string; message: IChatContent }) => {
        const chatMessage = ChatMessageModel.Model.getModel(data.uid);
        if (!chatMessage) {
            return;
        }

        if (data.message?.content && chatMessage.isPending) {
            chatMessage.isPending = undefined;
        }

        chatMessage.message = data.message;
    }, []);
    const endCallback = useCallback((data: { uid: string; status: "success" | "failed" | "cancelled" }) => {
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
    }, []);

    const sentHandlers = useBoardChatSentHandlers({ projectUID, callback: () => scrollToBottomRef.current() });
    const cancelledHandlers = useBoardChatCancelHandlers({ projectUID });
    const streamHandlers = useMemo(
        () => useBoardChatStreamHandlers({ projectUID, callbacks: { start: startCallback, buffer: bufferCallback, end: endCallback } }),
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
                scrollToBottomRef,
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
