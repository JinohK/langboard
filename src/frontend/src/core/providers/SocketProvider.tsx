import { createContext, useContext } from "react";
import { SOCKET_URL } from "@/constants";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { redirectToLogin, useAuth } from "@/core/providers/AuthProvider";

export type TEventName = "open" | "close" | "error" | (string & {});
export interface ISocketEvent<TResponse> {
    (data: TResponse): void;
}

interface ISocketMap {
    socket: WebSocket;
    events: Record<TEventName, ISocketEvent<unknown>[]>;
}

interface IConnectedSocket {
    on: <TResponse>(eventName: TEventName, event: ISocketEvent<TResponse>) => void;
    send: <TRequest>(eventName: TEventName, data: TRequest) => void;
}

export interface ISocketContext {
    connect: (path: string) => IConnectedSocket;
}

interface ISocketProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    connect: () => ({ on: () => {}, send: () => {} }),
};

const SocketContext = createContext<ISocketContext>(initialContext);

export const SocketProvider = ({ children }: ISocketProviderProps): React.ReactNode => {
    const { accessToken, refreshToken, refresh, login } = useAuth();
    const sockets: Record<string, ISocketMap> = {};

    const reconnect = (path: string) => {
        sockets[path].socket = new WebSocket(`${SOCKET_URL}${path}?authorization=${accessToken}`);
    };

    const connect = (path: string) => {
        if (!path.startsWith("/")) {
            path = `/${path}`;
        }

        function on<TResponse>(eventName: TEventName, event: ISocketEvent<TResponse>) {
            if (sockets[path].events[eventName]?.includes(event as ISocketEvent<unknown>)) {
                return;
            }

            if (!sockets[path].events[eventName]) {
                sockets[path].events[eventName] = [];
            }

            sockets[path].events[eventName].push(event as ISocketEvent<unknown>);
        }

        function send<TRequest>(eventName: TEventName, data: TRequest) {
            sockets[path].socket.send(JSON.stringify({ event: eventName, data }));
        }

        if (sockets[path]) {
            return { on, send };
        }

        sockets[path] = {
            socket: new WebSocket(`${SOCKET_URL}${path}?authorization=${accessToken}`),
            events: {} as Record<TEventName, ISocketEvent<unknown>[]>,
        };

        const ws = sockets[path].socket;

        const runEvents = async (eventName: TEventName, data?: unknown) => {
            const targetEvents = sockets[path].events[eventName] ?? [];
            for (let i = 0; i < targetEvents.length; ++i) {
                await targetEvents[i](data);
            }
        };

        ws.onopen = async (event) => {
            await runEvents("open", event);
        };

        ws.onmessage = async (event) => {
            const response = JSON.parse(event.data);
            if (!response.event) {
                console.error("Invalid response");
                return;
            }

            await runEvents(response.event, response.data);
        };

        ws.onclose = async (event) => {
            switch (event.code) {
                case EHttpStatus.HTTP_422_UNPROCESSABLE_ENTITY: {
                    const response = await refresh();

                    login(response.data.access_token, refreshToken!);
                    return reconnect(path);
                }
                case EHttpStatus.HTTP_401_UNAUTHORIZED:
                    return redirectToLogin();
            }

            await runEvents("close", { code: event.code });
        };

        return { on, send };
    };

    return (
        <SocketContext.Provider
            value={{
                connect,
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
