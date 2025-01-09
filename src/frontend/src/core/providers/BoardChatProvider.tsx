import { createContext, useContext } from "react";
import { InternalBotModel } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";

export interface IBoardChatContext {
    projectUID: string;
    bot: InternalBotModel.Interface;
    socket: ISocketContext;
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
};

const BoardChatContext = createContext<IBoardChatContext>(initialContext);

export const BoardChatProvider = ({ projectUID, bot, children }: IBoardChatProviderProps): React.ReactNode => {
    const socket = useSocket();

    return (
        <BoardChatContext.Provider
            value={{
                projectUID,
                bot,
                socket,
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
