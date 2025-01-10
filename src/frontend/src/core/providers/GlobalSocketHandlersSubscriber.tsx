import useBotCreatedHandlers from "@/controllers/socket/global/useBotCreatedHandlers";
import useGlobalRelationshipCreatedHandlers from "@/controllers/socket/global/useGlobalRelationshipCreatedHandlers";
import useSelectedGlobalRelationshipsDeletedHandlers from "@/controllers/socket/global/useSelectedGlobalRelationshipsDeletedHandlers";
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
    const globalRelationshipCreatedHandlers = useGlobalRelationshipCreatedHandlers({});
    const selectedGlobalRelationshipsDeletedHandlers = useSelectedGlobalRelationshipsDeletedHandlers({});

    useSwitchSocketHandlers({
        socket,
        handlers: [botCreatedHandlers, globalRelationshipCreatedHandlers, selectedGlobalRelationshipsDeletedHandlers],
    });

    return <GlobalSocketHandlersSubscriberContext.Provider value={{}}>{children}</GlobalSocketHandlersSubscriberContext.Provider>;
};
