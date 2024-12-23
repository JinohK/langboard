import useSocketHandler from "@/core/helpers/SocketHandler";
import { ISocketContext } from "@/core/providers/SocketProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type THandler = ReturnType<typeof useSocketHandler<any, any>>;

export interface IUseSwitchSocketHandlersProps {
    socket: ISocketContext;
    handlers: THandler | THandler[];
    dependencies?: unknown[];
}

const useSwitchSocketHandlers = ({ socket, handlers, dependencies }: IUseSwitchSocketHandlersProps) => {
    handlers = TypeUtils.isArray(handlers) ? handlers : [handlers];

    useEffect(() => {
        const offs: (() => void)[] = [];
        for (let i = 0; i < handlers.length; ++i) {
            const { topic, on } = handlers[i];

            if (!topic || !socket.subscribedTopics.includes(topic)) {
                continue;
            }

            offs.push(on().off);
        }

        return () => {
            for (let i = 0; i < offs.length; ++i) {
                offs[i]();
            }
        };
    }, [socket.subscribedTopics, ...(dependencies ?? [])]);
};

export default useSwitchSocketHandlers;
