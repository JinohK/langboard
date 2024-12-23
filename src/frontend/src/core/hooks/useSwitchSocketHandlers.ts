import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler from "@/core/helpers/SocketHandler";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { createUUID } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type THandler = ReturnType<typeof useSocketHandler<any, any>>;

export interface IUseSwitchSocketHandlersProps {
    socket: ISocketContext;
    handlers: THandler | THandler[];
    dependencies?: unknown[];
}

const useSwitchSocketHandlers = ({ socket, handlers, dependencies }: IUseSwitchSocketHandlersProps) => {
    handlers = TypeUtils.isArray(handlers) ? handlers : [handlers];
    const [subscribedTopics, setSubscribedTopics] = useState<ESocketTopic[]>([]);

    useEffect(() => {
        const notifiers: [ESocketTopic, string][] = [];
        for (let i = 0; i < handlers.length; ++i) {
            const { topic } = handlers[i];
            if (!topic) {
                continue;
            }

            const key = createUUID();
            notifiers.push([topic, key]);
            socket.subscribeTopicNotifier(topic, key, (isSubscribed) => {
                setSubscribedTopics((prev) => {
                    const newTopics = prev.filter((t) => t !== topic);
                    if (isSubscribed) {
                        newTopics.push(topic);
                    }
                    return newTopics;
                });
            });
        }

        return () => {
            for (let i = 0; i < notifiers.length; ++i) {
                const [topic, key] = notifiers[i];
                socket.unsubscribeTopicNotifier(topic, key);
            }
        };
    }, []);

    useEffect(() => {
        const offs: (() => void)[] = [];
        for (let i = 0; i < handlers.length; ++i) {
            const { topic, on } = handlers[i];
            if (!topic || !subscribedTopics.includes(topic)) {
                continue;
            }

            offs.push(on().off);
        }

        return () => {
            for (let i = 0; i < offs.length; ++i) {
                offs[i]();
            }
        };
    }, [subscribedTopics, ...(dependencies ?? [])]);
};

export default useSwitchSocketHandlers;
