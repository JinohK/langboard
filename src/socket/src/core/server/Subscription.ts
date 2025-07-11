import ISocketClient from "@/core/server/ISocketClient";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";

export interface IValidatorContext {
    client: ISocketClient;
    topicId: string;
}

class _Subscription {
    #subscriptions: Map<string, Map<string, Set<ISocketClient>>>;
    #validators: Map<string, (context: IValidatorContext) => Promise<bool>>;

    constructor() {
        this.#subscriptions = new Map();
        this.#validators = new Map();
    }

    public registerValidator(topic: ESocketTopic | string, validator: (context: IValidatorContext) => Promise<bool>): void {
        topic = Utils.String.convertSafeEnum(ESocketTopic, topic);

        this.#validators.set(topic, validator);
    }

    public async publish(topic: ESocketTopic | string, topicId: string, event: string, data: Record<string, unknown>) {
        topic = Utils.String.convertSafeEnum(ESocketTopic, topic);

        const subscriptions = this.#subscriptions.get(topic);
        if (!subscriptions) {
            return;
        }

        const subscriberSet = subscriptions.get(topicId);
        if (!subscriberSet) {
            return;
        }
        const subscribers = subscriberSet;

        const arraySubscribers = Array.from(subscribers);
        for (let i = 0; i < arraySubscribers.length; ++i) {
            const subscriber = arraySubscribers[i];

            subscriber.send({
                event,
                topic,
                topic_id: topicId,
                data,
            });
        }
    }

    public async subscribe(ws: ISocketClient, topic: ESocketTopic | string, topicIds: string | string[]) {
        topic = Utils.String.convertSafeEnum(ESocketTopic, topic);

        if (!this.#subscriptions.has(topic)) {
            this.#subscriptions.set(topic, new Map());
        }

        const subscriptions = this.#subscriptions.get(topic)!;

        topicIds = Utils.Type.isArray(topicIds) ? topicIds : [topicIds];
        const subscribedIDs: string[] = [];
        for (let i = 0; i < topicIds.length; ++i) {
            const topicId = topicIds[i];
            if (!Utils.Type.isString(topicId) || !topicId.length) {
                continue;
            }

            if (this.#validators.has(topic)) {
                const validator = this.#validators.get(topic)!;
                if (!(await validator({ client: ws, topicId }))) {
                    continue;
                }
            }

            if (!subscriptions.has(topicId)) {
                subscriptions.set(topicId, new Set());
            }

            const subscribers = subscriptions.get(topicId)!;

            subscribers.add(ws);
            subscribedIDs.push(topicId);
        }

        ws.send({
            event: "subscribed",
            topic,
            topic_id: subscribedIDs,
        });
    }

    public async unsubscribe(ws: ISocketClient, topic: ESocketTopic | string, topicId: string | string[]) {
        topic = Utils.String.convertSafeEnum(ESocketTopic, topic);

        const subscriptions = this.#subscriptions.get(topic);
        if (!subscriptions) {
            return;
        }

        topicId = Utils.Type.isArray(topicId) ? topicId : [topicId];
        for (let i = 0; i < topicId.length; ++i) {
            const id = topicId[i];
            const subscriberSet = subscriptions.get(id);
            if (!subscriberSet) {
                continue;
            }
            const subscribers = subscriberSet;

            subscribers.delete(ws);
        }

        if (!subscriptions.size) {
            this.#subscriptions.delete(topic);
        }

        ws.send({
            event: "unsubscribed",
            topic,
            topic_id: topicId,
        });
    }

    public async unsubscribeAll(ws: ISocketClient) {
        const topics = Array.from(this.#subscriptions.keys());
        for (let i = 0; i < topics.length; ++i) {
            const topic = topics[i];
            const subscriptions = this.#subscriptions.get(topic);
            if (!subscriptions) {
                continue;
            }

            subscriptions.forEach((subscribers) => {
                subscribers.delete(ws);
            });

            if (!subscriptions.size) {
                this.#subscriptions.delete(topic);
            }
        }
    }
}

const Subscription = new _Subscription();

export default Subscription;
