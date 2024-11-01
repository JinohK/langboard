import { createContext, useContext, useEffect } from "react";
import { SOCKET_URL } from "@/constants";
import { useAuth } from "@/core/providers/AuthProvider";
import { useLocation } from "react-router-dom";
import ESocketStatus from "@/core/helpers/ESocketStatus";
import { redirectToSignIn } from "@/core/helpers/AuthHelper";
import { refresh } from "@/core/helpers/Api";
import useSocketStore, { ISocketEvent, TEventName } from "@/core/stores/SocketStore";

export interface IStreamCallbackMap<TStartResponse = unknown, TBufferResponse = unknown, TEndResponse = unknown> {
    start: ISocketEvent<TStartResponse>;
    buffer: ISocketEvent<TBufferResponse>;
    end: ISocketEvent<TEndResponse>;
}

export interface IConnectedSocket {
    isConnected: () => bool;
    reconnect: () => IConnectedSocket;
    on: <TResponse>(eventName: TEventName, event: ISocketEvent<TResponse>) => { isConnected: bool };
    off: <TResponse>(eventName: TEventName, event: ISocketEvent<TResponse>) => { isConnected: bool };
    send: <TRequest>(eventName: TEventName, data: TRequest) => { isConnected: bool };
    stream: <TStartResponse = unknown, TBufferResponse = unknown, TEndResponse = unknown>(
        eventName: TEventName,
        callbacks: IStreamCallbackMap<TStartResponse, TBufferResponse, TEndResponse>
    ) => { isConnected: bool };
    streamOff: <TStartResponse = unknown, TBufferResponse = unknown, TEndResponse = unknown>(
        eventName: TEventName,
        callbacks: IStreamCallbackMap<TStartResponse, TBufferResponse, TEndResponse>
    ) => { isConnected: bool };
}

export interface ISocketContext {
    connect: (path: string) => IConnectedSocket;
    closeAll: () => void;
}

interface ISocketProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    connect: () => ({
        isConnected: () => false,
        reconnect: () => null!,
        on: () => ({ isConnected: false }),
        off: () => ({ isConnected: false }),
        send: () => ({ isConnected: false }),
        stream: () => ({ isConnected: false }),
        streamOff: () => ({ isConnected: false }),
    }),
    closeAll: () => {},
};

const SocketContext = createContext<ISocketContext>(initialContext);

export const SocketProvider = ({ children }: ISocketProviderProps): React.ReactNode => {
    const { getAccessToken, getRefreshToken, signIn } = useAuth();
    const { getSocket, setSocket, send: sendSocket, close, closeAll } = useSocketStore();

    const connect = (path: string) => {
        if (!path.startsWith("/")) {
            path = `/${path}`;
        }

        const isConnected = () => {
            const map = getSocket(path);
            return !!map && map.socket.readyState !== WebSocket.CLOSING && map.socket.readyState !== WebSocket.CLOSED;
        };

        const reconnect = () => {
            return connect(path);
        };

        const on = ((eventName: TEventName, event: ISocketEvent<unknown>) => {
            if (!isConnected()) {
                return { isConnected: false };
            }

            const { events } = getSocket(path);

            if (events[eventName]?.includes(event as ISocketEvent<unknown>)) {
                return { isConnected: true };
            }

            if (!events[eventName]) {
                events[eventName] = [];
            }

            events[eventName].push(event as ISocketEvent<unknown>);
            return { isConnected: true };
        }) as IConnectedSocket["on"];

        const off = ((eventName: TEventName, event: ISocketEvent<unknown>) => {
            if (!isConnected()) {
                return { isConnected: false };
            }

            const { events } = getSocket(path);

            if (!events[eventName]?.includes(event as ISocketEvent<unknown>)) {
                return { isConnected: true };
            }

            const index = events[eventName].indexOf(event as ISocketEvent<unknown>);
            events[eventName].splice(index, 1);
            return { isConnected: true };
        }) as IConnectedSocket["off"];

        const streamOff = ((eventName: TEventName, callbacks: IStreamCallbackMap) => {
            if (!isConnected()) {
                return { isConnected: false };
            }

            off(`${eventName}:start`, callbacks.start);
            off(`${eventName}:buffer`, callbacks.buffer);
            off(`${eventName}:end`, callbacks.end);

            return { isConnected: true };
        }) as IConnectedSocket["streamOff"];

        const send = ((eventName: TEventName, data: unknown) => {
            if (!isConnected()) {
                return { isConnected: false };
            }

            return { isConnected: sendSocket(path, JSON.stringify({ event: eventName, data })) };
        }) as IConnectedSocket["send"];

        const stream = ((eventName: TEventName, callbacks: IStreamCallbackMap) => {
            if (!isConnected()) {
                return { isConnected: false };
            }

            on(`${eventName}:start`, callbacks.start);
            on(`${eventName}:buffer`, callbacks.buffer);
            on(`${eventName}:end`, callbacks.end);

            return { isConnected: true };
        }) as IConnectedSocket["stream"];

        if (getSocket(path)) {
            return { isConnected, reconnect, on, off, send, stream, streamOff };
        }

        setSocket(path, new WebSocket(`${SOCKET_URL}${path}?authorization=${getAccessToken()}`));

        const socketMap = getSocket(path);

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
                    const token = await refresh();

                    signIn(token, getRefreshToken()!);
                    return reconnect();
                }
                case ESocketStatus.WS_3000_UNAUTHORIZED:
                    return redirectToSignIn();
            }

            await runEvents("close", { code: event.code });

            close(path);
        };

        return { isConnected, reconnect, on, off, send, stream, streamOff };
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
