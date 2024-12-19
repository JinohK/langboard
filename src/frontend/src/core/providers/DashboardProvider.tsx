import { IAuthUser } from "@/core/providers/AuthProvider";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { createContext, useContext } from "react";
import { NavigateFunction } from "react-router-dom";

export interface IDashboardContext {
    navigate: NavigateFunction;
    currentUser: IAuthUser;
    socket: ISocketContext;
}

interface IDashboardProps {
    navigate: NavigateFunction;
    currentUser: IAuthUser;
    children: React.ReactNode;
}

const initialContext = {
    navigate: () => {},
    currentUser: {} as IAuthUser,
    socket: {} as ISocketContext,
};

const DashboardContext = createContext<IDashboardContext>(initialContext);

export const DashboardProvider = ({ navigate, currentUser, children }: IDashboardProps): React.ReactNode => {
    const socket = useSocket();

    return (
        <DashboardContext.Provider
            value={{
                navigate,
                socket,
                currentUser,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
};
