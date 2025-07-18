/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebSocket } from "ws";
import { IncomingMessage } from "http";
import Subscription from "@/core/server/Subscription";
import User from "@/models/User";
import ISocketClient, { TSocketSendParams } from "@/core/server/ISocketClient";
import Hocus from "@/core/server/Hocus";
import { Utils } from "@langboard/core/utils";
import { ESocketStatus, ESocketTopic } from "@langboard/core/enums";
import Logger from "@/core/utils/Logger";

// Lifetime management for socket clients
const clients = new Set<ISocketClient>();

class SocketClient implements ISocketClient {
    #ws: WebSocket;
    #request: IncomingMessage;
    #user: User;
    #hocusDocNames: Set<string>;
    #eventListeners: Partial<Record<keyof WebSocket.WebSocketEventMap, ((...args: any[]) => void)[]>>;

    public get user(): User {
        return this.#user;
    }

    constructor(ws: WebSocket, request: IncomingMessage, user: User) {
        this.#ws = ws;
        this.#request = request;
        this.#user = user;
        this.#hocusDocNames = new Set();
        this.#eventListeners = {
            close: [() => this.onClose()],
        };

        Object.entries(this.#eventListeners).forEach(([event, listeners]) => {
            if (!listeners) {
                return;
            }

            listeners.forEach((listener) => {
                this.#ws.addEventListener(event, listener);
            });
        });

        clients.add(this);
    }

    public async subscribe(topic: ESocketTopic | string, topicId: string | string[]) {
        await Subscription.subscribe(this, topic, topicId);
    }

    public async unsubscribe(topic: ESocketTopic | string, topicId: string | string[]) {
        await Subscription.unsubscribe(this, topic, topicId);
    }

    public send<TData = unknown>(event: TSocketSendParams<TData>): void {
        event.topic = Utils.String.convertSafeEnum(ESocketTopic, event.topic);

        if (this.#ws.readyState === WebSocket.CONNECTING) {
            setTimeout(() => {
                this.send(event);
            }, 1000);
            return;
        }

        if (this.#ws.readyState !== WebSocket.OPEN) {
            return;
        }

        this.#ws.send(
            JSON.stringify(event),
            {
                fin: true,
            },
            (error) => {
                if (error) {
                    Logger.red(error, "\n");
                }
            }
        );
    }

    public sendError(errorCode: ESocketStatus | number, message: string, shouldClose: bool = false) {
        this.#ws.send(
            JSON.stringify({
                event: "error",
                error_code: errorCode,
                message,
            }),
            {
                fin: true,
            }
        );

        if (shouldClose) {
            this.#ws.close(errorCode);
        }
    }

    public stream(topic: ESocketTopic, topicId: string, baseEvent: string) {
        topic = Utils.String.convertSafeEnum(ESocketTopic, topic);

        const send = (event: "start" | "buffer" | "end", data: Record<string, unknown> = {}) => {
            this.send({
                event: `${baseEvent}:${event}`,
                topic,
                topic_id: topicId,
                data,
            });
        };

        const start = (data: Record<string, unknown> = {}) => {
            send("start", data);
        };

        const buffer = (data: Record<string, unknown> = {}) => {
            send("buffer", data);
        };

        const end = (data: Record<string, unknown> = {}) => {
            send("end", data);
        };

        return {
            start,
            buffer,
            end,
        };
    }

    public async startHocus(documentName: string) {
        this.#hocusDocNames.add(documentName);
        Hocus.handleConnection(this.#ws, this.#request);
    }

    public async endHocus(documentName: string) {
        this.#hocusDocNames.delete(documentName);
        const document = Hocus.documents.get(documentName);
        if (!document) {
            return;
        }

        const connections = document.getConnections();
        let connection;
        for (let i = 0; i < connections.length; ++i) {
            connection = connections[i];
            if (connection.webSocket === this.#ws) {
                break;
            }
            connection = undefined;
            continue;
        }

        if (!connection) {
            return;
        }

        connection.document.removeConnection(connection);
        connection.callbacks.onClose.forEach((callback) => callback(document));
    }

    public onClose() {
        Object.entries(this.#eventListeners).forEach(([event, listeners]) => {
            if (!listeners) {
                return;
            }

            listeners.forEach((listener) => {
                this.#ws.addEventListener(event, listener);
            });
        });

        Subscription.unsubscribeAll(this);

        clients.delete(this);
        this.#ws = undefined!;
        this.#request = undefined!;
        this.#user = undefined!;
        this.#hocusDocNames.clear();
        this.#eventListeners = {};
    }
}

export default SocketClient;
