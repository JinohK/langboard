/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect } from "react";
import { refresh } from "@/core/helpers/Api";
import { redirectToSignIn } from "@/core/helpers/AuthHelper";
import ESocketStatus from "@/core/helpers/ESocketStatus";
import { useAuth } from "@/core/providers/AuthProvider";
import useSocketStore, {
    getTopicWithId,
    ISocketEvent,
    ISocketStore,
    TEventName,
    TSocketAddEventProps,
    TSocketRemoveEventProps,
} from "@/core/stores/SocketStore";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { getCookieStore } from "@/core/stores/CookieStore";
import { APP_ACCESS_TOKEN, APP_REFRESH_TOKEN } from "@/constants";

interface IBaseRunEventsProps {
    topic?: ESocketTopic;
    topicId?: string;
    eventName: TEventName;
    data?: unknown;
}

interface INoneTopicRunEventsProps extends IBaseRunEventsProps {
    topic: ESocketTopic.None;
    topicId?: never;
    eventName: Exclude<TEventName, "open" | "close" | "error">;
}

interface IGlobalTopicRunEventsProps extends IBaseRunEventsProps {
    topic: ESocketTopic.Global;
    topicId?: never;
    eventName: Exclude<TEventName, "open" | "close" | "error">;
}

interface ITopicRunEventsProps extends IBaseRunEventsProps {
    topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>;
    topicId: string;
    eventName: Exclude<TEventName, "open" | "close" | "error">;
}

interface IDefaultEventsRunEventsProps extends IBaseRunEventsProps {
    topic?: never;
    topicId?: never;
    eventName: "open" | "close" | "error";
}

type TRunEventsProps = INoneTopicRunEventsProps | IGlobalTopicRunEventsProps | ITopicRunEventsProps | IDefaultEventsRunEventsProps;

interface IBaseSocketSendProps {
    topic?: ESocketTopic;
    topicId?: string;
    eventName: Exclude<TEventName, "open" | "close" | "error">;
    data: any;
}

interface INoneOrGlobalTopicSocketSendProps extends IBaseSocketSendProps {
    topic: ESocketTopic.None | ESocketTopic.Global;
    topicId?: never;
}

interface ITopicSocketSendProps extends IBaseSocketSendProps {
    topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>;
    topicId: string;
}

type TSocketSendProps = INoneOrGlobalTopicSocketSendProps | ITopicSocketSendProps;

export interface IStreamCallbackMap<TStartResponse = unknown, TBufferResponse = unknown, TEndResponse = unknown> {
    start: ISocketEvent<TStartResponse>;
    buffer: ISocketEvent<TBufferResponse>;
    end: ISocketEvent<TEndResponse>;
}

export interface ISocketContext {
    isConnected: () => bool;
    reconnect: () => void;
    on: <TResponse>(props: TSocketAddEventProps<TResponse>) => void;
    off: (props: TSocketRemoveEventProps) => void;
    send: (props: TSocketSendProps) => { isConnected: bool };
    stream: <TStartResponse = unknown, TBufferResponse = unknown, TEndResponse = unknown>(
        props: Omit<TSocketAddEventProps<unknown>, "callback"> & { callbacks: IStreamCallbackMap<TStartResponse, TBufferResponse, TEndResponse> }
    ) => void;
    streamOff: (props: Omit<TSocketRemoveEventProps, "callback"> & { callbacks: IStreamCallbackMap<any, any, any> }) => void;
    subscribe: ISocketStore["subscribe"];
    unsubscribe: ISocketStore["unsubscribe"];
    subscribeTopicNotifier: ISocketStore["subscribeTopicNotifier"];
    unsubscribeTopicNotifier: ISocketStore["unsubscribeTopicNotifier"];
    close: ISocketStore["close"];
    isSubscribed: ISocketStore["isSubscribed"];
}

interface ISocketProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    subscribedTopics: [],
    isConnected: () => false,
    reconnect: () => initialContext,
    on: () => {},
    off: () => {},
    send: () => ({ isConnected: false }),
    stream: () => {},
    streamOff: () => {},
    subscribe: () => {},
    unsubscribe: () => {},
    subscribeTopicNotifier: () => {},
    unsubscribeTopicNotifier: () => {},
    close: () => {},
    isSubscribed: () => false,
};

const SocketContext = createContext<ISocketContext>(initialContext);

const createSharedSocketHandlers = () => {
    const {
        getSocket,
        addEvent,
        removeEvent,
        send: sendSocket,
        close,
        subscribe,
        unsubscribe,
        subscribeTopicNotifier,
        unsubscribeTopicNotifier,
        isSubscribed,
    } = useSocketStore.getState();

    const isConnected = () => {
        const socket = getSocket();
        return !!socket && socket.readyState !== WebSocket.CLOSING && socket.readyState !== WebSocket.CLOSED;
    };

    const on: ISocketContext["on"] = (props) => {
        addEvent(props as never);
    };

    const off: ISocketContext["off"] = (props) => {
        removeEvent(props);
    };

    const stream: ISocketContext["stream"] = (props) => {
        const { callbacks } = props;
        on({
            ...props,
            topic: props.topic as never,
            event: `${props.event}:start`,
            callback: callbacks.start,
        });
        on({
            ...props,
            topic: props.topic as never,
            event: `${props.event}:buffer`,
            callback: callbacks.buffer,
        });
        on({
            ...props,
            topic: props.topic as never,
            event: `${props.event}:end`,
            callback: callbacks.end,
        });
    };

    const streamOff: ISocketContext["streamOff"] = (props) => {
        off({
            ...props,
            topic: props.topic as never,
            event: `${props.event}:start`,
            callback: props.callbacks.start,
        });
        off({
            ...props,
            topic: props.topic as never,
            event: `${props.event}:buffer`,
            callback: props.callbacks.buffer,
        });
        off({
            ...props,
            topic: props.topic as never,
            event: `${props.event}:end`,
            callback: props.callbacks.end,
        });
    };

    const send = (props: TSocketSendProps) => {
        if (!isConnected()) {
            return { isConnected: false };
        }

        const { topic, topicId, eventName, data } = props;

        return { isConnected: sendSocket(JSON.stringify({ event: eventName, topic, topic_id: topicId, data })) };
    };

    return {
        isConnected,
        on,
        off,
        send,
        stream,
        streamOff,
        subscribe,
        unsubscribe,
        subscribeTopicNotifier,
        unsubscribeTopicNotifier,
        close,
        isSubscribed,
    };
};

export const SocketProvider = ({ children }: ISocketProviderProps): React.ReactNode => {
    const { getAccessToken, getRefreshToken, signIn, isAuthenticated } = useAuth();
    const { getSocket, createSocket, getStore, close } = useSocketStore.getState();
    const cookieStore = getCookieStore();

    useEffect(() => {
        if (isAuthenticated()) {
            if (!isConnected()) {
                connect();
            }
        }
    }, [isAuthenticated]);

    if (!getAccessToken()) {
        return children;
    }

    const isConnected = () => {
        const socket = getSocket();
        return !!socket && socket.readyState !== WebSocket.CLOSING && socket.readyState !== WebSocket.CLOSED;
    };

    const connect = () => {
        createSocket<Record<string, any>>({
            accessToken: getAccessToken()!,
            onOpen: async (event) => {
                await runEvents({
                    eventName: "open",
                    data: event,
                });
            },
            onMessage: async (response) => {
                if (!response.event) {
                    console.error("Invalid response");
                    return;
                }

                if (!response.topic) {
                    response.topic = ESocketTopic.None;
                }

                await runEvents({
                    topic: response.topic,
                    topicId: response.topic_id,
                    eventName: response.event,
                    data: response.data,
                });
            },
            onError: async (event) => {
                await runEvents({
                    eventName: "error",
                    data: event,
                });
            },
            onClose: async (event) => {
                switch (event.code) {
                    case ESocketStatus.WS_3001_EXPIRED_TOKEN: {
                        const token = await refresh();

                        signIn(token, getRefreshToken()!);
                        reconnect();
                        return;
                    }
                    case ESocketStatus.WS_3000_UNAUTHORIZED:
                        close();
                        cookieStore.remove(APP_ACCESS_TOKEN);
                        cookieStore.remove(APP_REFRESH_TOKEN);
                        return redirectToSignIn();
                    case ESocketStatus.WS_1006_ABNORMAL_CLOSURE:
                        setTimeout(() => {
                            if (isAuthenticated()) {
                                reconnect();
                            }
                        }, 5000);
                        return;
                }

                await runEvents({
                    eventName: "close",
                    data: event,
                });

                close();
            },
        });
    };

    const socketMap = getStore();

    const runEvents = async (props: TRunEventsProps) => {
        const { eventName, data } = props;
        if (eventName === "open" || eventName === "error" || eventName === "close") {
            const targetEvents = Object.values(socketMap.defaultEvents[eventName] ?? {}).flat();
            for (let i = 0; i < targetEvents.length; ++i) {
                await targetEvents[i](data);
            }
            return;
        }

        const { topic, topicId } = getTopicWithId(props);

        const targetEvents = Object.values(socketMap.subscriptions[topic]?.[topicId]?.[eventName] ?? {}).flat();
        for (let i = 0; i < targetEvents.length; ++i) {
            await targetEvents[i](data);
        }
    };

    const reconnect = () => {
        connect();
    };

    return (
        <SocketContext.Provider
            value={{
                ...createSharedSocketHandlers(),
                reconnect,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};

export const useSocketOutsideProvider = (): Omit<ISocketContext, "reconnect" | "close"> => {
    return {
        ...createSharedSocketHandlers(),
    };
};
