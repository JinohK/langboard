import Auth from "@/core/security/Auth";
import ESocketStatus from "@/core/server/ESocketStatus";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/server/ESocketTopic";
import SocketClient from "@/core/server/SocketClient";
import { isValidURL } from "@/core/utils/StringUtils";
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import TypeUtils from "@/core/utils/TypeUtils";
import JsonUtils from "@/core/utils/JsonUtils";
import EventManager from "@/core/server/EventManager";

class SocketManager {
    #server: WebSocketServer;

    constructor(server: WebSocketServer) {
        this.#server = server;
        this.#server.on("connection", async (ws, request) => await this.#handleConnection(ws, request));
    }

    async destroy() {
        this.#server.removeAllListeners("connection");
        this.#server = null!;
    }

    async #handleConnection(ws: WebSocket, request: IncomingMessage) {
        if (!request?.url) {
            ws.close(ESocketStatus.WS_1008_POLICY_VIOLATION);
            return;
        }

        const url = new URL(!isValidURL(request.url) ? `http://localhost${request.url}` : request.url);
        const user = await Auth.validateToken("socket", url.searchParams);
        if (!user) {
            ws.close(ESocketStatus.WS_3000_UNAUTHORIZED);
            return;
        }

        const client = new SocketClient(ws, request, user);
        await client.subscribe(ESocketTopic.Global, [GLOBAL_TOPIC_ID]);
        await client.subscribe(ESocketTopic.UserPrivate, [user.uid]);

        let pingTimer: NodeJS.Timeout | null = null;
        const ping = () => {
            if (pingTimer) {
                clearTimeout(pingTimer);
                pingTimer = null;
            }

            ws.ping();

            pingTimer = setTimeout(ping, 30000);
        };

        ping();

        ws.on("message", async (message) => {
            if (TypeUtils.isNullOrUndefined(message)) {
                return;
            }

            if (!message.toString()) {
                await ws.send("");
                return;
            }

            const decoder = new TextDecoder("utf-8");
            let parsedMessage;
            try {
                parsedMessage = JsonUtils.Parse(decoder.decode(message as ArrayBuffer));
            } catch (error) {
                return;
            }

            const { event, topic, topic_id, data } = parsedMessage;

            switch (event) {
                case "subscribe":
                    await client.subscribe(topic, topic_id);
                    break;
                case "unsubscribe":
                    await client.unsubscribe(topic, topic_id);
                    break;
                case "hocus:start":
                    await client.startHocus(data.documentName);
                    break;
                case "hocus:end":
                    await client.endHocus(data.documentName);
                    break;
                default:
                    await EventManager.emit(topic, event, {
                        client,
                        data,
                        topicId: topic_id,
                    });
            }
        });

        ws.on("close", async () => {
            if (pingTimer) {
                clearTimeout(pingTimer);
                pingTimer = null;
            }
        });
    }
}

export default SocketManager;
