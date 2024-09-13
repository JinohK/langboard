import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "universal-cookie";
import { APP_ACCESS_TOKEN, APP_SECRET_TOKEN } from "@/constants";
import { ROUTES } from "@/core/routing/constants";

export interface ISocketContext {
    accessToken: string | null;
    secretToken: string | null;
    isAuthenticated: () => boolean;
    login: (accessToken: string, secretToken: string) => void;
    logout: () => void;
}

interface ISocketProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    accessToken: null,
    secretToken: null,
    isAuthenticated: () => false,
    login: () => {},
    logout: () => {},
};

const SocketContext = createContext<ISocketContext>(initialContext);

export const SocketProvider = ({ children }: ISocketProviderProps): React.ReactNode => {
    const cookies = new Cookies();
    const [accessToken, setAccessToken] = useState<string | null>(cookies.get(APP_ACCESS_TOKEN) ?? null);
    const [secretToken, setSecretToken] = useState<string | null>(cookies.get(APP_SECRET_TOKEN) ?? null);

    const isAuthenticated = (): boolean => {
        return accessToken !== null && secretToken !== null;
    };

    const login = () => {};

    const logout = () => {
        setAccessToken(null);
        setSecretToken(null);

        location.href = ROUTES.LOGIN;
    };

    useEffect(() => {
        const newAccessToken = cookies.get(APP_ACCESS_TOKEN) ?? null;
        if (newAccessToken && newAccessToken !== accessToken) {
            setAccessToken(newAccessToken);
        }
    }, []);

    useEffect(() => {
        const newSecretToken = cookies.get(APP_SECRET_TOKEN) ?? null;
        if (newSecretToken && newSecretToken !== secretToken) {
            setSecretToken(newSecretToken);
        }
    }, []);

    return (
        <SocketContext.Provider
            value={{
                accessToken,
                secretToken,
                isAuthenticated,
                login,
                logout,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within an SocketProvider");
    }
    return context;
};
