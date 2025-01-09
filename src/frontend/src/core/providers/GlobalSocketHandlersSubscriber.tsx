import useBotCreatedHandlers from "@/controllers/socket/global/useBotCreatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useSocket } from "@/core/providers/SocketProvider";
import { createContext } from "react";

interface IGlobalSocketHandlersSubscriberProps {
    children: React.ReactNode;
}

const GlobalSocketHandlersSubscriberContext = createContext({});

export const GlobalSocketHandlersSubscriber = ({ children }: IGlobalSocketHandlersSubscriberProps): React.ReactNode => {
    const socket = useSocket();
    const botCreatedHandlers = useBotCreatedHandlers({});

    useSwitchSocketHandlers({ socket, handlers: [botCreatedHandlers] });

    return <GlobalSocketHandlersSubscriberContext.Provider value={{}}>{children}</GlobalSocketHandlersSubscriberContext.Provider>;
};
