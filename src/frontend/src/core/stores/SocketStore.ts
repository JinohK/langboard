import { SOCKET_URL } from "@/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { create } from "zustand";

export type TDefaultEvents = "open" | "close" | "error";
export type TEventName = TDefaultEvents | (string & {});
export interface ISocketEvent<TResponse> {
    (data: TResponse): void;
}
export type TSocketTopicId = string;
export type TEventMap = Partial<Record<TEventName, Record<string, ISocketEvent<unknown>[]>>>;
export type TSocketSubscriptionMap = Record<TSocketTopicId, TEventMap>;

export interface ISocketCreateSocketProps<TResponse> {
    accessToken: string;
    onOpen: (event: Event) => Promise<void> | void;
    onMessage: (response: TResponse) => Promise<void> | void;
    onError: (event: Event) => Promise<void> | void;
    onClose: (event: CloseEvent) => Promise<void> | void;
}

interface IBaseSocketAddEventProps<TResponse> {
    eventKey: string;
    callback: ISocketEvent<TResponse>;
}

interface INonTopicSocketAddEventProps<TResponse> extends IBaseSocketAddEventProps<TResponse> {
    topic: ESocketTopic.None;
    topicId?: never;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface ITopicSocketAddEventProps<TResponse> extends IBaseSocketAddEventProps<TResponse> {
    topic: Exclude<ESocketTopic, ESocketTopic.None>;
    topicId: string;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface IDefaultSocketAddEventProps<TResponse> extends IBaseSocketAddEventProps<TResponse> {
    topic?: never;
    topicId?: never;
    event: TDefaultEvents;
}

export type TSocketAddEventProps<TResponse> =
    | INonTopicSocketAddEventProps<TResponse>
    | ITopicSocketAddEventProps<TResponse>
    | IDefaultSocketAddEventProps<TResponse>;

interface IBaseSocketRemoveEventProps {
    eventKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: ISocketEvent<any>;
}

interface INonTopicSocketRemoveEventProps extends IBaseSocketRemoveEventProps {
    topic: ESocketTopic.None;
    topicId?: never;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface ITopicSocketRemoveEventProps extends IBaseSocketRemoveEventProps {
    topic: Exclude<ESocketTopic, ESocketTopic.None>;
    topicId: string;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface IDefaultSocketRemoveEventProps extends IBaseSocketRemoveEventProps {
    topic?: never;
    topicId?: never;
    event: TDefaultEvents;
}

export type TSocketRemoveEventProps = INonTopicSocketRemoveEventProps | ITopicSocketRemoveEventProps | IDefaultSocketRemoveEventProps;

export interface ISocketMap {
    subscriptions: Partial<Record<ESocketTopic, TSocketSubscriptionMap>>;
    defaultEvents: TEventMap;
    sendingQueue: string[];
    sendingQueueTimeout?: NodeJS.Timeout;
    subscribedCallbackQueue: Partial<Record<ESocketTopic, Record<string, (() => void)[]>>>;
}

export interface ISocketStore {
    getSocket: () => WebSocket | null;
    createSocket: <TResponse>(props: ISocketCreateSocketProps<TResponse>) => WebSocket;
    getStore: () => ISocketMap;
    addEvent: (props: TSocketAddEventProps<unknown>) => void;
    removeEvent: (props: TSocketRemoveEventProps) => void;
    send: (json: string) => bool;
    close: () => void;
    subscribe: (topic: Exclude<ESocketTopic, ESocketTopic.None>, topicId: string, callback?: () => void) => void;
    unsubscribe: (topic: Exclude<ESocketTopic, ESocketTopic.None>, topicId: string) => void;
}

const useSocketStore = create<ISocketStore>(() => {
    const socketMap: ISocketMap = {
        subscriptions: {},
        defaultEvents: {},
        sendingQueue: [],
        subscribedCallbackQueue: {},
    };
    let socket: WebSocket | null = null;

    const getSocket = () => {
        return socket;
    };

    const createSocket = (({ accessToken, onOpen, onMessage, onError, onClose }: ISocketCreateSocketProps<unknown>) => {
        if (socket) {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                return socket;
            } else {
                socket.onopen = null;
                socket.onclose = null;
                socket.onerror = null;
                socket.onmessage = null;
            }
        }

        socket = new WebSocket(`${SOCKET_URL}?authorization=${accessToken}`);
        Object.entries(socketMap.subscriptions).forEach(([topic, subscriptions]) => {
            Object.keys(subscriptions).forEach((topicId) => {
                if (topic === ESocketTopic.None) {
                    return;
                }

                subscribe(topic as Exclude<ESocketTopic, ESocketTopic.None>, topicId);
            });
        });

        const ping = () => {
            if (!socket) {
                return;
            }

            if (socket.readyState === WebSocket.CONNECTING) {
                setTimeout(ping, 3000);
                return;
            }

            if (socket.readyState !== WebSocket.OPEN) {
                return;
            }

            socket.send("");
            setTimeout(ping, 20000);
        };

        ping();

        socket.onopen = async (event) => {
            await onOpen(event);
        };

        socket.onmessage = async (event) => {
            if (!event.data) {
                return;
            }

            const response = JSON.parse(event.data);
            if (response.event === "subscribed") {
                if (!response.topic || !response.topic_id) {
                    return;
                }

                const topic = response.topic as ESocketTopic;
                if (!socketMap.subscriptions[topic]) {
                    socketMap.subscriptions[topic] = {};
                }

                if (!socketMap.subscriptions[topic][response.topic_id]) {
                    socketMap.subscriptions[topic][response.topic_id] = {};
                }

                if (socketMap.subscribedCallbackQueue[topic] && socketMap.subscribedCallbackQueue[topic][response.topic_id]) {
                    socketMap.subscribedCallbackQueue[topic][response.topic_id].forEach((cb) => cb());
                    delete socketMap.subscribedCallbackQueue[topic][response.topic_id];
                }
                return;
            }

            if (response.event === "unsubscribed") {
                if (!response.topic || !response.topic_id) {
                    return;
                }

                const topic = response.topic as ESocketTopic;
                if (!socketMap.subscriptions[topic]) {
                    return;
                }

                delete socketMap.subscriptions[topic][response.topic_id];

                if (socketMap.subscribedCallbackQueue[topic] && socketMap.subscribedCallbackQueue[topic][response.topic_id]) {
                    delete socketMap.subscribedCallbackQueue[topic][response.topic_id];
                }
                return;
            }

            await onMessage(response);
        };

        socket.onerror = async (event) => {
            await onError(event);
        };

        socket.onclose = async (event) => {
            await onClose(event);
        };

        return socket;
    }) as ISocketStore["createSocket"];

    const getStore = () => {
        return socketMap;
    };

    const addEvent = (props: TSocketAddEventProps<unknown>) => {
        const { event, eventKey, callback } = props;
        if (event === "open" || event === "close" || event === "error") {
            if (!socketMap.defaultEvents[event]) {
                socketMap.defaultEvents[event] = {};
            }

            if (!socketMap.defaultEvents[event][eventKey]) {
                socketMap.defaultEvents[event][eventKey] = [];
            }

            if (socketMap.defaultEvents[event][eventKey].includes(callback)) {
                return;
            }

            socketMap.defaultEvents[event][eventKey].push(callback);
            return;
        }

        const topic = props.topic ?? ESocketTopic.None;
        const topicId = topic === ESocketTopic.None ? "none" : props.topicId!;
        if (!socketMap.subscriptions[topic]) {
            socketMap.subscriptions[topic] = {};
        }

        if (!socketMap.subscriptions[topic][topicId]) {
            socketMap.subscriptions[topic][topicId] = {};
        }

        const events = socketMap.subscriptions[topic][topicId];
        if (!events[event]) {
            events[event] = {};
        }

        if (!events[event][eventKey]) {
            events[event][eventKey] = [];
        }

        if (events[event][eventKey].includes(callback)) {
            return;
        }

        events[event][eventKey].push(callback);
    };

    const removeEvent = (props: TSocketRemoveEventProps) => {
        const { event, eventKey, callback } = props;
        if (event === "open" || event === "close" || event === "error") {
            if (!socketMap.defaultEvents[event]?.[eventKey]) {
                return;
            }

            socketMap.defaultEvents[event][eventKey] = socketMap.defaultEvents[event][eventKey].filter((cb) => cb !== callback);
            return;
        }

        const topic = props.topic ?? ESocketTopic.None;
        const topicId = topic === ESocketTopic.None ? "none" : props.topicId!;

        if (!socketMap.subscriptions[topic]?.[topicId]) {
            return;
        }

        const events = socketMap.subscriptions[topic][topicId];
        if (!events[event]?.[eventKey]) {
            return;
        }

        events[event][eventKey] = events[event][eventKey].filter((cb) => cb !== callback);
    };

    const send = (json: string) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            socketMap.sendingQueue.push(json);
            socketMap.sendingQueueTimeout = setTimeout(() => sendQueue(), 300);
            return true;
        }

        socket.send(json);
        return true;
    };

    const sendQueue = () => {
        if (socketMap.sendingQueueTimeout) {
            clearTimeout(socketMap.sendingQueueTimeout);
        }

        if (socketMap.sendingQueue.length === 0 || !socket || (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING)) {
            return;
        }

        if (socket.readyState !== WebSocket.OPEN) {
            socketMap.sendingQueueTimeout = setTimeout(() => sendQueue(), 300);
            return;
        }

        while (socketMap.sendingQueue.length > 0) {
            const json = socketMap.sendingQueue.shift()!;
            socket.send(json);
        }
    };

    const close = () => {
        Object.entries(socketMap.subscriptions).forEach(([topic, subscriptions]) => {
            Object.keys(subscriptions).forEach((topicId) => {
                if (topic === ESocketTopic.None) {
                    return;
                }

                unsubscribe(topic as Exclude<ESocketTopic, ESocketTopic.None>, topicId);
            });
        });

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
    };

    const subscribe = (topic: Exclude<ESocketTopic, ESocketTopic.None>, topicId: string, callback?: () => void) => {
        if (!socket) {
            return;
        }

        if (callback) {
            if (!socketMap.subscribedCallbackQueue[topic]) {
                socketMap.subscribedCallbackQueue[topic] = {};
            }

            if (!socketMap.subscribedCallbackQueue[topic][topicId]) {
                socketMap.subscribedCallbackQueue[topic][topicId] = [];
            }

            if (!socketMap.subscribedCallbackQueue[topic][topicId].includes(callback)) {
                socketMap.subscribedCallbackQueue[topic][topicId].push(callback);
            }
        }

        console.log(socketMap);

        send(
            JSON.stringify({
                event: "subscribe",
                topic,
                topic_id: topicId,
            })
        );
    };

    const unsubscribe = (topic: Exclude<ESocketTopic, ESocketTopic.None>, topicId: string) => {
        if (!socket || !socketMap.subscriptions[topic] || !socketMap.subscriptions[topic][topicId]) {
            return;
        }

        send(
            JSON.stringify({
                event: "unsubscribe",
                topic,
                topic_id: topicId,
            })
        );
    };

    return { getSocket, createSocket, getStore, addEvent, removeEvent, send, close, subscribe, unsubscribe };
});

export default useSocketStore;
