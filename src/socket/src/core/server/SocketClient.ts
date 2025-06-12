import { WebSocket } from "ws";
import { IncomingMessage } from "http";
import ESocketTopic from "@/core/server/ESocketTopic";
import Subscription from "@/core/server/Subscription";
import User from "@/models/User";
import ISocketClient, { TSocketSendParams } from "@/core/server/ISocketClient";
import Hocus from "@/core/server/Hocus";
import ESocketStatus from "@/core/server/ESocketStatus";
import { convertSafeEnum } from "@/core/utils/StringUtils";
import Terminal from "@/core/utils/Terminal";

class SocketClient implements ISocketClient {
    #ws: WebSocket;
    #request: IncomingMessage;
    #user: User;
    #subscriptions: Map<string, string[]>;
    #hocusDocNames: Set<string> = new Set();

    public get user(): User {
        return this.#user;
    }

    constructor(ws: WebSocket, request: IncomingMessage, user: User) {
        this.#ws = ws;
        this.#request = request;
        this.#user = user;
        this.#subscriptions = new Map();

        this.#ws.addEventListener("close", () => this.onClose());
    }

    public get getSubscriptions(): Map<string, string[]> {
        return this.#subscriptions;
    }

    public async subscribe(topic: ESocketTopic | string, topicId: string | string[]) {
        await Subscription.subscribe(this, topic, topicId);
    }

    public async unsubscribe(topic: ESocketTopic | string, topicId: string | string[]) {
        await Subscription.unsubscribe(this, topic, topicId);
    }

    public send<TData = unknown>(event: TSocketSendParams<TData>): void {
        event.topic = convertSafeEnum(ESocketTopic, event.topic);

        this.#ws.send(
            JSON.stringify(event),
            {
                fin: true,
            },
            (error) => {
                if (error) {
                    Terminal.red("WebSocket send error", error, "\n");
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
        topic = convertSafeEnum(ESocketTopic, topic);

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

    public async onClose() {
        this.#ws.removeEventListener("close", this.onClose);

        await Subscription.unsubscribeAll(this);

        this.#ws = undefined!;
        this.#request = undefined!;
        this.#user = undefined!;
        this.#subscriptions.clear();
        this.#subscriptions = undefined!;
    }
}

export default SocketClient;
