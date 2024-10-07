import { createContext, useContext, useEffect } from "react";
import { SOCKET_URL } from "@/constants";
import { redirectToLogin, useAuth } from "@/core/providers/AuthProvider";
import { useLocation } from "react-router-dom";
import { create } from "zustand";
import ESocketStatus from "@/core/helpers/ESocketStatus";

export type TEventName = "open" | "close" | "error" | (string & {});
export interface ISocketEvent<TResponse> {
    (data: TResponse): void;
}

interface ISocketMap {
    socket: WebSocket;
    events: Record<TEventName, ISocketEvent<unknown>[]>;
}

export interface IConnectedSocket {
    on: <TResponse>(eventName: TEventName, event: ISocketEvent<TResponse>) => void;
    send: <TRequest>(eventName: TEventName, data: TRequest) => void;
}

export interface ISocketContext {
    connect: (path: string) => IConnectedSocket;
    closeAll: () => void;
}

interface ISocketProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    connect: () => ({ on: () => {}, send: () => {} }),
    closeAll: () => {},
};

const SocketContext = createContext<ISocketContext>(initialContext);

const useSockets = create<{ sockets: Record<string, ISocketMap> }>(() => ({
    sockets: {},
}));

export const SocketProvider = ({ children }: ISocketProviderProps): React.ReactNode => {
    const { accessToken, refreshToken, refresh, login } = useAuth();
    const { sockets } = useSockets();

    const reconnect = (path: string) => {
        sockets[path].socket = new WebSocket(`${SOCKET_URL}${path}?authorization=${accessToken}`);
    };

    const connect = (path: string) => {
        if (!path.startsWith("/")) {
            path = `/${path}`;
        }

        const on = ((eventName: TEventName, event: ISocketEvent<unknown>) => {
            if (sockets[path].events[eventName]?.includes(event as ISocketEvent<unknown>)) {
                return;
            }

            if (!sockets[path].events[eventName]) {
                sockets[path].events[eventName] = [];
            }

            sockets[path].events[eventName].push(event as ISocketEvent<unknown>);
        }) as IConnectedSocket["on"];

        const send = ((eventName: TEventName, data: unknown) => {
            sockets[path].socket.send(JSON.stringify({ event: eventName, data }));
        }) as IConnectedSocket["send"];

        if (sockets[path]) {
            return { on, send };
        }

        sockets[path] = {
            socket: new WebSocket(`${SOCKET_URL}${path}?authorization=${accessToken}`),
            events: {} as Record<TEventName, ISocketEvent<unknown>[]>,
        };

        const socketMap = sockets[path];

        const runEvents = async (eventName: TEventName, data?: unknown) => {
            const targetEvents = socketMap.events[eventName] ?? [];
            for (let i = 0; i < targetEvents.length; ++i) {
                await targetEvents[i](data);
            }
        };

        socketMap.socket.onopen = async (event) => {
            await runEvents("open", event);
        };

        socketMap.socket.onmessage = async (event) => {
            const response = JSON.parse(event.data);
            if (!response.event) {
                console.error("Invalid response");
                return;
            }

            await runEvents(response.event, response.data);
        };

        socketMap.socket.onclose = async (event) => {
            switch (event.code) {
                case ESocketStatus.WS_3001_EXPIRED_TOKEN: {
                    const response = await refresh();

                    login(response.data.access_token, refreshToken!);
                    return reconnect(path);
                }
                case ESocketStatus.WS_3000_UNAUTHORIZED:
                    return redirectToLogin();
            }

            await runEvents("close", { code: event.code });

            delete sockets[path];
        };

        return { on, send };
    };

    const closeAll = () => {
        Object.keys(sockets).forEach((path) => {
            sockets[path].socket.close();
            delete sockets[path];
        });
    };

    return (
        <SocketContext.Provider
            value={{
                connect,
                closeAll,
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

export const SocketRouteWrapper = ({ children }: ISocketProviderProps): React.ReactNode => {
    const { closeAll } = useSocket();
    const location = useLocation();

    useEffect(() => {
        closeAll();
    }, [location]);

    return children;
};
