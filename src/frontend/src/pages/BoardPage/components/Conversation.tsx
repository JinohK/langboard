import { Virtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import VirtualInfiniteList from "@/components/VirtualInfiniteList";
import useGetProjectChatMessages from "@/controllers/board/useGetProjectChatMessages";
import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import ChatMessage, { IChatMessageProps } from "@/pages/BoardPage/components/ChatMessage";

export interface IConversationProps {
    uid: string;
    socket: IConnectedSocket;
    inputRef: React.RefObject<HTMLInputElement>;
    buttonRef: React.RefObject<HTMLButtonElement>;
    sendChatCallbackRef: React.MutableRefObject<(message: string) => void>;
}

const params = { project_uid: "", page: 1, limit: 20, current_date: new Date() };

function Conversation({ uid, socket, inputRef, buttonRef, sendChatCallbackRef }: IConversationProps) {
    const [t] = useTranslation();
    const conversationRef = useRef<HTMLDivElement>(null);
    const virtualizerRef = useRef<Virtualizer<HTMLElement, Element> | null>(null);
    params.project_uid = uid;
    params.current_date = new Date();
    const {
        status,
        data: chatHistories,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useGetProjectChatMessages(params, {
        getNextPageParam: (lastPage, _, lastPageParam) => {
            if (lastPage.histories.length === params.limit) {
                return {
                    ...lastPageParam,
                    page: lastPageParam.page + 1,
                };
            } else {
                return undefined;
            }
        },
    });
    const [messages, setMessages] = useState<IChatMessageProps[]>(chatHistories?.pages.flatMap((page) => page.histories) ?? []);
    const streamChatRef = useRef<IChatMessageProps | null>(null);
    const sentCallback = useCallback((data: { uid: string; message: string }) => {
        setMessages((prev) => [
            ...prev.slice(0, 1),
            {
                uid: data.uid,
                message: data.message,
                isReceived: false,
            },
            ...prev.slice(2),
        ]);
        conversationRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);
    const startCallback = useCallback((data: { uid: string }) => {
        const chatList = conversationRef.current!.querySelector(".chat-list")!;
        if (chatList.querySelector(`#chat-${data.uid}`)) {
            return;
        }

        streamChatRef.current = {
            uid: data.uid,
            message: "",
            isReceived: true,
            isWaiting: true,
        };

        setMessages((prev) => [streamChatRef.current!, ...prev.slice(1)]);
        conversationRef.current?.scrollTo({ top: 0 });
    }, []);
    const bufferCallback = useCallback((data: { uid: string; message: string }) => {
        if (!streamChatRef.current || streamChatRef.current.uid !== data.uid) {
            return;
        }

        streamChatRef.current.message = data.message;
        streamChatRef.current.isWaiting = false;

        setMessages((prev) => [...prev]);
    }, []);
    const endCallback = useCallback((data: { uid: string }) => {
        if (!streamChatRef.current || streamChatRef.current.uid !== data.uid) {
            return;
        }

        setMessages((prev) => [...prev]);

        streamChatRef.current = null;
        params.current_date = new Date();
        inputRef.current!.disabled = false;
        buttonRef.current!.disabled = false;
    }, []);
    sendChatCallbackRef.current = (message: string) => {
        setMessages((prev) => [
            {
                uid: "waiting-response-chat-receiving",
                message: "",
                isReceived: true,
                isWaiting: true,
            },
            {
                uid: "waiting-response-chat-sending",
                message: message,
                isReceived: false,
                isWaiting: true,
            },
            ...prev,
        ]);
    };

    useEffect(() => {
        if (!socket.isConnected()) {
            socket.reconnect();
        }

        const streamCallbacks = {
            start: startCallback,
            buffer: bufferCallback,
            end: endCallback,
        };

        socket.on(SOCKET_SERVER_EVENTS.BOARD.CHAT_SENT, sentCallback);
        socket.stream(SOCKET_SERVER_EVENTS.BOARD.CHAT_STREAM, streamCallbacks);

        return () => {
            socket.off(SOCKET_SERVER_EVENTS.BOARD.CHAT_SENT, sentCallback);
            socket.streamOff(SOCKET_SERVER_EVENTS.BOARD.CHAT_STREAM, streamCallbacks);
        };
    }, []);

    useEffect(() => {
        if (chatHistories) {
            setMessages(chatHistories.pages.flatMap((page) => page.histories));
        }
    }, [chatHistories]);

    const nextPage = async () => {
        await new Promise((resolve) => {
            setTimeout(async () => {
                await fetchNextPage();
                resolve(null);
            }, 2500);
        });
    };

    return (
        <div className="h-[calc(100%_-_theme(spacing.28))] overflow-y-auto" ref={conversationRef}>
            <VirtualInfiniteList
                status={status}
                items={messages}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={nextPage}
                scrollable={() => conversationRef.current!}
                createItem={(item) => <ChatMessage key={item.uid} {...item} />}
                overscan={20}
                isReverse
                gap={5}
                className="chat-list md:p-2"
                itemClassName="md:p-2"
                noItemsElement={
                    <h2 className="truncate text-nowrap pb-3 text-center text-sm text-accent-foreground">{t("project.Ask anything to {app} AI!")}</h2>
                }
                virtualizerRef={virtualizerRef}
            />
        </div>
    );
}

export default Conversation;
