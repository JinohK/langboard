import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler from "@/core/helpers/SocketHandler";
import useSocketStreamHandler from "@/core/hooks/useSocketStreamHandler";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { getTopicWithId } from "@/core/stores/SocketStore";
import { createUUID } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type THandler = ReturnType<typeof useSocketHandler<any, any>> | ReturnType<typeof useSocketStreamHandler>;

export interface IUseSwitchSocketHandlersProps {
    socket: ISocketContext;
    handlers: THandler | THandler[];
    dependencies?: unknown[];
}

const useSwitchSocketHandlers = ({ socket, handlers, dependencies }: IUseSwitchSocketHandlersProps) => {
    handlers = TypeUtils.isArray(handlers) ? handlers : [handlers];
    const [subscribedTopics, setSubscribedTopics] = useState<ESocketTopic[]>([]);

    useEffect(() => {
        const notifiers: [ESocketTopic, string, string][] = [];
        for (let i = 0; i < handlers.length; ++i) {
            const { topic, topicId } = getTopicWithId(handlers[i]);

            const key = createUUID();
            notifiers.push([topic, topicId, key]);
            socket.subscribeTopicNotifier({
                topic,
                topicId: topicId as never,
                key,
                notifier: (subscribedTopicId, isSubscribed) => {
                    if (subscribedTopicId !== topicId) {
                        return;
                    }

                    setSubscribedTopics((prev) => {
                        const newTopics = prev.filter((t) => t !== topic);
                        if (isSubscribed) {
                            newTopics.push(topic);
                        }
                        return [...newTopics];
                    });
                },
            });
        }

        return () => {
            for (let i = 0; i < notifiers.length; ++i) {
                const [topic, topicId, key] = notifiers[i];
                socket.unsubscribeTopicNotifier({ topic, topicId: topicId as never, key });
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

            offs.push(on());
        }

        return () => {
            for (let i = 0; i < offs.length; ++i) {
                offs[i]();
            }
        };
    }, [subscribedTopics, ...(dependencies ?? [])]);

    return { subscribedTopics };
};

export default useSwitchSocketHandlers;
