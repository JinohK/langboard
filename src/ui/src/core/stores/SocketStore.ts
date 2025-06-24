import { SOCKET_URL } from "@/constants";
import ESocketTopic, { GLOBAL_TOPIC_ID, NONE_TOPIC_ID } from "@/core/helpers/ESocketTopic";
import { deleteDeepRecordMap, getDeepRecordMap } from "@/core/utils/ObjectUtils";
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

interface INoneOrGloablTopicSocketAddEventProps<TResponse> extends IBaseSocketAddEventProps<TResponse> {
    topic: ESocketTopic.None | ESocketTopic.Global;
    topicId?: never;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface ITopicSocketAddEventProps<TResponse> extends IBaseSocketAddEventProps<TResponse> {
    topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>;
    topicId: string;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface IDefaultSocketAddEventProps<TResponse> extends IBaseSocketAddEventProps<TResponse> {
    topic?: never;
    topicId?: never;
    event: TDefaultEvents;
}

export type TSocketAddEventProps<TResponse> =
    | INoneOrGloablTopicSocketAddEventProps<TResponse>
    | ITopicSocketAddEventProps<TResponse>
    | IDefaultSocketAddEventProps<TResponse>;

interface IBaseSocketRemoveEventProps {
    eventKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: ISocketEvent<any>;
}

interface INoneOrGlobalTopicSocketRemoveEventProps extends IBaseSocketRemoveEventProps {
    topic: ESocketTopic.None | ESocketTopic.Global;
    topicId?: never;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface ITopicSocketRemoveEventProps extends IBaseSocketRemoveEventProps {
    topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>;
    topicId: string;
    event: Exclude<TEventName, TDefaultEvents>;
}

interface IDefaultSocketRemoveEventProps extends IBaseSocketRemoveEventProps {
    topic?: never;
    topicId?: never;
    event: TDefaultEvents;
}

interface IBaseSocketTopicNotifierProps {
    topic: ESocketTopic;
    topicId?: string;
    key: string;
    notifier: TSocketTopicNotifier;
}

interface INoneOrGlobalSocketTopicNotifierProps extends IBaseSocketTopicNotifierProps {
    topic: ESocketTopic.None | ESocketTopic.Global;
    topicId?: never;
}

interface ITopicSocketTopicNotifierProps extends IBaseSocketTopicNotifierProps {
    topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>;
    topicId: string;
}

export type TSocketTopicNotifierProps = INoneOrGlobalSocketTopicNotifierProps | ITopicSocketTopicNotifierProps;

interface IBaseSocketTopicNotifierRemoveProps {
    topic: ESocketTopic;
    topicId?: string;
    key: string;
}

interface INoneOrGlobalSocketTopicNotifierRemoveProps extends IBaseSocketTopicNotifierRemoveProps {
    topic: ESocketTopic.None | ESocketTopic.Global;
    topicId?: never;
}

interface ITopicSocketTopicNotifierRemoveProps extends IBaseSocketTopicNotifierRemoveProps {
    topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>;
    topicId: string;
}

export type TSocketTopicNotifierRemoveProps = INoneOrGlobalSocketTopicNotifierRemoveProps | ITopicSocketTopicNotifierRemoveProps;

export type TSocketRemoveEventProps = INoneOrGlobalTopicSocketRemoveEventProps | ITopicSocketRemoveEventProps | IDefaultSocketRemoveEventProps;

type TSocketTopicNotifier = (topicId: string, isSubscribed: bool) => void;
type TSocketTopicNotifierMap = {
    [TSocketTopic in ESocketTopic]: {
        [topicId: string]: {
            [key: string]: TSocketTopicNotifier;
        };
    };
};

export interface ISocketMap {
    subscriptions: Partial<Record<ESocketTopic, TSocketSubscriptionMap>>;
    defaultEvents: TEventMap;
    sendingQueue: string[];
    sendingQueueTimeout?: NodeJS.Timeout;
    subscribedCallbackQueue: Partial<Record<ESocketTopic, Record<string, (() => void)[]>>>;
    unsubscribedCallbackQueue: Partial<Record<ESocketTopic, Record<string, (() => void)[]>>>;
    subscribedTopicNotifiers: Partial<TSocketTopicNotifierMap>;
    subscribedTopics: Partial<Record<ESocketTopic, string[]>>;
}

export interface ISocketStore {
    getSocket: () => WebSocket | null;
    createSocket: <TResponse>(props: ISocketCreateSocketProps<TResponse>) => WebSocket;
    getStore: () => ISocketMap;
    addEvent: (props: TSocketAddEventProps<unknown>) => void;
    removeEvent: (props: TSocketRemoveEventProps) => void;
    send: (json: string) => bool;
    close: () => void;
    subscribe: (topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>, topicIds: string[], callback?: () => void) => void;
    unsubscribe: (topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>, topicIds: string[], callback?: () => void) => void;
    subscribeTopicNotifier: (props: TSocketTopicNotifierProps) => void;
    unsubscribeTopicNotifier: (props: TSocketTopicNotifierRemoveProps) => void;
    isSubscribed: (topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>, topicId: string) => bool;
}

const socketMap: ISocketMap = {
    subscriptions: {},
    defaultEvents: {},
    sendingQueue: [],
    subscribedCallbackQueue: {},
    unsubscribedCallbackQueue: {},
    subscribedTopicNotifiers: {},
    subscribedTopics: {},
};
let socket: WebSocket | null = null;
const useSocketStore = create<ISocketStore>(() => {
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
            if (topic === ESocketTopic.None || topic === ESocketTopic.Global) {
                return;
            }

            subscribe(topic, Object.keys(subscriptions));
        });

        socket.onopen = async (event) => {
            await onOpen(event);
        };

        socket.onmessage = async (event) => {
            if (!event.data) {
                return;
            }

            const response = JSON.parse(event.data);
            if (response.event !== "subscribed" && response.event !== "unsubscribed") {
                await onMessage(response);
                return;
            }

            const topic = response.topic as ESocketTopic;
            const topicIds = response.topic_id as string[];
            if (!topic || !topicIds) {
                return;
            }

            if (response.event === "subscribed") {
                subscribedCallback(topic, topicIds);
            } else {
                unsubscribedCallback(topic, topicIds);
            }
        };

        socket.onerror = async (event) => {
            await onError(event);
        };

        socket.onclose = async (event) => {
            await onClose(event);
        };

        return socket;
    }) as ISocketStore["createSocket"];

    const subscribedCallback = (topic: ESocketTopic, topicIds: string[]) => {
        if (!socketMap.subscribedTopics[topic]) {
            socketMap.subscribedTopics[topic] = topicIds;
        }

        if (!socketMap.subscriptions[topic]) {
            socketMap.subscriptions[topic] = {};
        }

        for (let i = 0; i < topicIds.length; ++i) {
            const topicId = topicIds[i];
            if (!socketMap.subscriptions[topic][topicId]) {
                socketMap.subscriptions[topic][topicId] = {};
            }

            if (socketMap.subscribedCallbackQueue[topic]?.[topicId]) {
                socketMap.subscribedCallbackQueue[topic][topicId].forEach((cb) => cb());
                delete socketMap.subscribedCallbackQueue[topic][topicId];
            }

            if (socketMap.subscribedTopicNotifiers[topic]?.[topicId]) {
                Object.values(socketMap.subscribedTopicNotifiers[topic][topicId]).forEach((notifier) => notifier(topicId, true));
            }
        }
    };

    const unsubscribedCallback = (topic: ESocketTopic, topicIds: string[]) => {
        for (let i = 0; i < topicIds.length; ++i) {
            const topicId = topicIds[i];
            if (socketMap.subscribedTopics[topic]?.includes(topicId)) {
                delete socketMap.subscribedTopics[topic];
            }

            if (socketMap.subscriptions[topic]) {
                delete socketMap.subscriptions[topic][topicId];
            }

            if (socketMap.subscribedCallbackQueue[topic]?.[topicId]) {
                delete socketMap.subscribedCallbackQueue[topic][topicId];
            }

            if (socketMap.unsubscribedCallbackQueue[topic]?.[topicId]) {
                socketMap.unsubscribedCallbackQueue[topic][topicId].forEach((cb) => cb());
                delete socketMap.unsubscribedCallbackQueue[topic][topicId];
            }

            if (socketMap.subscribedTopicNotifiers[topic]?.[topicId]) {
                Object.values(socketMap.subscribedTopicNotifiers[topic][topicId]).forEach((notifier) => notifier(topicId, false));
            }
        }
    };

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

        const { topic, topicId } = getTopicWithId(props);
        const events = getDeepRecordMap(true, socketMap.subscriptions, topic, topicId, event);
        if (!events[eventKey]) {
            events[eventKey] = [];
        }

        if (events[eventKey].includes(callback)) {
            return;
        }

        events[eventKey].push(callback);
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

        const { topic, topicId } = getTopicWithId(props);
        const events = getDeepRecordMap(false, socketMap.subscriptions, topic, topicId, event);
        if (!events?.[eventKey]) {
            return;
        }

        events[eventKey] = events[eventKey].filter((cb) => cb !== callback);
        if (!events[eventKey].length) {
            delete events[eventKey];
        }

        deleteDeepRecordMap(socketMap.subscriptions, topic, topicId, event);
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

        if (!socketMap.sendingQueue.length || !socket || (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING)) {
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
            unsubscribe(topic as Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>, Object.keys(subscriptions!));
        });

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
    };

    const subscribe = (topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>, topicIds: string[], callback?: () => void) => {
        if (!socket) {
            return;
        }

        if (callback) {
            if (!socketMap.subscribedCallbackQueue[topic]) {
                socketMap.subscribedCallbackQueue[topic] = {};
            }

            for (let i = 0; i < topicIds.length; ++i) {
                const topicId = topicIds[i];
                if (!socketMap.subscribedCallbackQueue[topic][topicId]) {
                    socketMap.subscribedCallbackQueue[topic][topicId] = [];
                }

                if (!socketMap.subscribedCallbackQueue[topic][topicId].includes(callback)) {
                    socketMap.subscribedCallbackQueue[topic][topicId].push(callback);
                }
            }
        }

        send(
            JSON.stringify({
                event: "subscribe",
                topic,
                topic_id: topicIds,
            })
        );
    };

    const unsubscribe = (topic: Exclude<ESocketTopic, ESocketTopic.None>, topicIds: string[], callback?: () => void) => {
        if (!socket || !socketMap.subscriptions[topic]) {
            return;
        }

        for (let i = 0; i < topicIds.length; ++i) {
            const topicId = topicIds[i];
            if (socketMap.subscriptions[topic][topicId]) {
                delete socketMap.subscriptions[topic][topicId];
            }

            if (callback) {
                if (!socketMap.unsubscribedCallbackQueue[topic]) {
                    socketMap.unsubscribedCallbackQueue[topic] = {};
                }

                if (!socketMap.unsubscribedCallbackQueue[topic][topicId]) {
                    socketMap.unsubscribedCallbackQueue[topic][topicId] = [];
                }

                if (!socketMap.unsubscribedCallbackQueue[topic][topicId].includes(callback)) {
                    socketMap.unsubscribedCallbackQueue[topic][topicId].push(callback);
                }
            }
        }

        send(
            JSON.stringify({
                event: "unsubscribe",
                topic,
                topic_id: topicIds,
            })
        );
    };

    const subscribeTopicNotifier = (props: TSocketTopicNotifierProps) => {
        const { topic, topicId } = getTopicWithId(props);
        const { key, notifier } = props;

        const subscribedNotifier = getDeepRecordMap(true, socketMap.subscribedTopicNotifiers, topic, topicId);
        if (subscribedNotifier[key]) {
            return;
        }

        subscribedNotifier[key] = notifier;
        if (socketMap.subscribedTopics[topic]?.includes(topicId)) {
            notifier(topicId, true);
        }
    };

    const unsubscribeTopicNotifier = (props: TSocketTopicNotifierRemoveProps) => {
        const { topic, topicId } = getTopicWithId(props);
        const { key } = props;

        deleteDeepRecordMap(socketMap.subscribedTopicNotifiers, topic, topicId, key);
    };

    const isSubscribed = (topic: Exclude<ESocketTopic, ESocketTopic.None | ESocketTopic.Global>, topicId: string) => {
        return socketMap.subscribedTopics[topic]?.includes(topicId) ?? false;
    };

    return {
        getSocket,
        createSocket,
        getStore,
        addEvent,
        removeEvent,
        send,
        close,
        subscribe,
        unsubscribe,
        subscribeTopicNotifier,
        unsubscribeTopicNotifier,
        isSubscribed,
    };
});

export const getTopicWithId = (props: { topic?: ESocketTopic; topicId?: string }) => {
    const topic = props.topic ?? ESocketTopic.None;
    let topicId;
    switch (topic) {
        case ESocketTopic.None:
            topicId = NONE_TOPIC_ID;
            break;
        case ESocketTopic.Global:
            topicId = GLOBAL_TOPIC_ID;
            break;
        default:
            topicId = props.topicId!;
            break;
    }

    return { topic, topicId };
};

export default useSocketStore;
