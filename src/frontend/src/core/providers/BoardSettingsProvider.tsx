import { AuthUser, BotModel, Project } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { createContext, useContext } from "react";
import { NavigateFunction } from "react-router-dom";

export interface IBoardSettingsContext {
    navigate: NavigateFunction;
    socket: ISocketContext;
    project: Project.TModel;
    allBots: BotModel.TModel[];
    currentUser: AuthUser.TModel;
}

interface IBoardSettingsProps {
    navigate: NavigateFunction;
    project: Project.TModel;
    currentUser: AuthUser.TModel;
    children: React.ReactNode;
}

const initialContext = {
    navigate: () => {},
    socket: {} as ISocketContext,
    project: {} as Project.TModel,
    allBots: [],
    currentUser: {} as AuthUser.TModel,
};

const BoardSettingsContext = createContext<IBoardSettingsContext>(initialContext);

export const BoardSettingsProvider = ({ navigate, project, currentUser, children }: IBoardSettingsProps): React.ReactNode => {
    const socket = useSocket();
    const allBots = BotModel.Model.useModels(() => true);

    return (
        <BoardSettingsContext.Provider
            value={{
                navigate,
                socket,
                project,
                allBots,
                currentUser,
            }}
        >
            {children}
        </BoardSettingsContext.Provider>
    );
};

export const useBoardSettings = () => {
    const context = useContext(BoardSettingsContext);
    if (!context) {
        throw new Error("useBoardSettings must be used within a BoardSettingsProvider");
    }
    return context;
};
