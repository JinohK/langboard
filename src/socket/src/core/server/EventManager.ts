import ESocketTopic from "@/core/server/ESocketTopic";
import SocketClient from "@/core/server/SocketClient";
import { convertSafeEnum } from "@/core/utils/StringUtils";

type TEventContext = {
    client: SocketClient;
    data: Record<string, unknown>;
    topicId: string;
};

type TEventCallback = (context: TEventContext) => void | Promise<void>;

class _EventManager {
    #events: Map<string, Partial<Record<ESocketTopic, TEventCallback[]>>>;

    constructor() {
        this.#events = new Map();
    }

    public on(topic: ESocketTopic, event: string, callback: TEventCallback): _EventManager {
        topic = convertSafeEnum(ESocketTopic, topic);

        if (!this.#events.has(event)) {
            this.#events.set(event, {});
        }
        if (!this.#events.get(event)![topic]) {
            this.#events.get(event)![topic] = [];
        }
        this.#events.get(event)![topic]!.push(callback);

        return this;
    }

    public async emit(topic: ESocketTopic, event: string, context: TEventContext): Promise<void> {
        topic = convertSafeEnum(ESocketTopic, topic);

        if (!this.#events.has(event) || !this.#events.get(event)![topic]) {
            return;
        }

        const callbacks = this.#events.get(event)![topic]!;
        for (let i = 0; i < callbacks.length; ++i) {
            const callback = callbacks[i];

            try {
                await callback(context);
            } catch {
                continue;
            }
        }
    }
}

const EventManager = new _EventManager();

export default EventManager;
