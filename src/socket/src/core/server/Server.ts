import { PORT } from "@/Constants";
import * as http from "http";
import { WebSocketServer } from "ws";
import ESocketStatus from "@/core/server/ESocketStatus";
import SocketClient from "@/core/server/SocketClient";
import TypeUtils from "@/core/utils/TypeUtils";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/server/ESocketTopic";
import EventManager from "@/core/server/EventManager";
import JsonUtils from "@/core/utils/JsonUtils";
import Terminal from "@/core/utils/Terminal";
import Routes from "@/core/server/Routes";
import Auth from "@/core/security/Auth";
import { isValidURL } from "@/core/utils/StringUtils";

class _Server {
    #webSocketServer!: WebSocketServer;
    #httpServer!: http.Server;
    #callbackMap: { before: () => Promise<void>; after?: () => void | Promise<void> } = {
        before: async () => {},
    };

    constructor() {
        this.#createServers();
        this.#addEvents();
    }

    public run(beforeRun?: () => Promise<void>, afterRun?: () => void | Promise<void>) {
        if (beforeRun) {
            this.#callbackMap.before = beforeRun;
        }
        this.#callbackMap.after = afterRun;

        this.#callbackMap.before().then(() => {
            this.#httpServer.listen(PORT, () => {
                Terminal.cyan(`WebSocket server is running on ws://127.0.0.1:${PORT}\n`);
                this.#callbackMap.after?.();
            });
        });
    }

    public restart() {
        this.destroy();
        this.#createServers();
        this.#addEvents();
        this.run();
    }

    public destroy() {
        if (this.#webSocketServer) {
            this.#webSocketServer.close();
            this.#webSocketServer = null!;
        }
        if (this.#httpServer) {
            this.#httpServer.close();
            this.#httpServer = null!;
        }
    }

    #createServers() {
        this.#httpServer = http.createServer(async (req, res) => {
            await Routes.route(req, res);
        });
        this.#webSocketServer = new WebSocketServer({
            server: this.#httpServer,
        });
    }

    #addEvents() {
        this.#webSocketServer.on("connection", async (ws, request) => {
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
        });
    }
}

const Server = new _Server();

export default Server;
