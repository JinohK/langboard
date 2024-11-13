import { create } from "zustand";

export type TEventName = "open" | "close" | "error" | (string & {});
export interface ISocketEvent<TResponse> {
    (data: TResponse): void;
}

export interface ISocketMap {
    socket: WebSocket;
    events: Partial<Record<TEventName, ISocketEvent<unknown>[]>>;
    sendingQueue: string[];
    sendingQueueTimeout?: NodeJS.Timeout;
}

interface ISocketStore {
    getSocket: (path: string) => ISocketMap;
    setSocket: (path: string, socket: WebSocket) => void;
    send: (path: string, json: string) => bool;
    close: (path: string) => void;
    closeAll: () => void;
}

const useSocketStore = create<ISocketStore>(() => {
    const sockets: Record<string, ISocketMap> = {};

    const getSocket = (path: string) => {
        return sockets[path];
    };

    const setSocket = (path: string, socket: WebSocket) => {
        if (sockets[path]) {
            if (sockets[path].socket && sockets[path].socket.readyState === WebSocket.OPEN) {
                sockets[path].socket.close();
            }

            sockets[path].socket = socket;
        } else {
            sockets[path] = { socket, events: {}, sendingQueue: [] };
        }

        const ping = () => {
            if (socket.readyState === WebSocket.CONNECTING) {
                setTimeout(ping, 3000);
                return;
            }

            if (socket.readyState !== WebSocket.OPEN) {
                return;
            }

            socket.send("");
            setTimeout(ping, 20000);
        };

        ping();
    };

    const sendQueue = (map: ISocketMap) => {
        if (map.sendingQueueTimeout) {
            clearTimeout(map.sendingQueueTimeout);
        }

        if (map.sendingQueue.length === 0 || (map.socket.readyState !== WebSocket.OPEN && map.socket.readyState !== WebSocket.CONNECTING)) {
            return;
        }

        if (map.socket.readyState !== WebSocket.OPEN) {
            map.sendingQueueTimeout = setTimeout(() => sendQueue(map), 300);
            return;
        }

        while (map.sendingQueue.length > 0) {
            const json = map.sendingQueue.shift()!;
            map.socket.send(json);
        }
    };

    const send = (path: string, json: string) => {
        const map = getSocket(path);
        if (!map) {
            return false;
        }

        if (map.socket.readyState !== WebSocket.OPEN) {
            map.sendingQueue.push(json);
            map.sendingQueueTimeout = setTimeout(() => sendQueue(map), 300);
            return true;
        }

        map.socket.send(json);
        return true;
    };

    const close = (path: string) => {
        if (!sockets[path]) {
            return;
        }

        if (sockets[path].socket.readyState === WebSocket.OPEN) {
            sockets[path].socket.close();
        }

        delete sockets[path];
    };

    const closeAll = () => {
        Object.keys(sockets).forEach((path) => {
            if (sockets[path].socket.readyState === WebSocket.OPEN) {
                sockets[path].socket.close();
            }
            delete sockets[path];
        });
    };

    return { getSocket, setSocket, send, close, closeAll };
});

export default useSocketStore;
