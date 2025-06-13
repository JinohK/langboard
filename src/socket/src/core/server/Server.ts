import { PORT } from "@/Constants";
import * as http from "http";
import { WebSocketServer } from "ws";
import Terminal from "@/core/utils/Terminal";
import Routes from "@/core/server/Routes";
import SocketManager from "@/core/server/SocketManager";

class _Server {
    #webSocketServer!: WebSocketServer;
    #httpServer!: http.Server;
    #socketManager!: SocketManager;
    #callbackMap: { before: () => Promise<void>; after?: () => void | Promise<void> } = {
        before: async () => {},
    };

    constructor() {
        this.#createServers();
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
        this.run();
    }

    public destroy() {
        if (this.#socketManager) {
            this.#socketManager.destroy();
            this.#socketManager = null!;
        }
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
        this.#socketManager = new SocketManager(this.#webSocketServer);
    }
}

const Server = new _Server();

export default Server;
