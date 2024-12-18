import { Project } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { createContext, useContext } from "react";
import { NavigateFunction } from "react-router-dom";

export interface IBoardSettingsContext {
    navigate: NavigateFunction;
    socket: ISocketContext;
    project: Project.IBoard;
    currentUser: IAuthUser;
}

interface IBoardSettingsProps {
    navigate: NavigateFunction;
    project: Project.IBoard;
    currentUser: IAuthUser;
    children: React.ReactNode;
}

const initialContext = {
    navigate: () => {},
    socket: {} as ISocketContext,
    project: {} as Project.IBoard,
    currentUser: {} as IAuthUser,
};

const BoardSettingsContext = createContext<IBoardSettingsContext>(initialContext);

export const BoardSettingsProvider = ({ navigate, project, currentUser, children }: IBoardSettingsProps): React.ReactNode => {
    const socket = useSocket();

    return (
        <BoardSettingsContext.Provider
            value={{
                navigate,
                socket,
                project,
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
