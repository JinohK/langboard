import ESocketTopic from "@/core/server/ESocketTopic";
import ISocketClient from "@/core/server/ISocketClient";
import { convertSafeEnum } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface IValidatorContext {
    client: ISocketClient;
    topicId: string;
}

class _Subscription {
    #subscriptions: Map<string, Map<string, [WeakSet<ISocketClient>, Set<ISocketClient>]>>;
    #validators: Map<string, (context: IValidatorContext) => Promise<bool>>;

    constructor() {
        this.#subscriptions = new Map();
        this.#validators = new Map();
    }

    public registerValidator(topic: ESocketTopic | string, validator: (context: IValidatorContext) => Promise<bool>): void {
        topic = convertSafeEnum(ESocketTopic, topic);

        this.#validators.set(topic, validator);
    }

    public async publish(topic: ESocketTopic | string, topicId: string, event: string, data: Record<string, unknown>) {
        topic = convertSafeEnum(ESocketTopic, topic);

        const subscriptions = this.#subscriptions.get(topic);
        if (!subscriptions) {
            return;
        }

        const subscriberSet = subscriptions.get(topicId);
        if (!subscriberSet) {
            return;
        }
        const [subscribers, subscribersIteratable] = subscriberSet;

        const arraySubscribers = Array.from(subscribersIteratable);
        for (let i = 0; i < arraySubscribers.length; ++i) {
            const subscriber = arraySubscribers[i];
            if (!subscribers.has(subscriber)) {
                subscribers.delete(subscriber);
                subscribersIteratable.delete(subscriber);
                continue;
            }

            subscriber.send({
                event,
                topic,
                topic_id: topicId,
                data,
            });
        }
    }

    public async subscribe(ws: ISocketClient, topic: ESocketTopic | string, topicId: string | string[]) {
        topic = convertSafeEnum(ESocketTopic, topic);

        if (!this.#subscriptions.has(topic)) {
            this.#subscriptions.set(topic, new Map());
        }

        const subscriptions = this.#subscriptions.get(topic)!;

        topicId = TypeUtils.isArray(topicId) ? topicId : [topicId];
        const subscribedIDs: string[] = [];
        for (let i = 0; i < topicId.length; ++i) {
            const id = topicId[i];
            if (!TypeUtils.isString(id) || !id.length) {
                continue;
            }

            if (this.#validators.has(topic)) {
                const validator = this.#validators.get(topic)!;
                if (!(await validator({ client: ws, topicId: id }))) {
                    continue;
                }
            }

            if (!subscriptions.has(id)) {
                subscriptions.set(id, [new WeakSet(), new Set()]);
            }

            const [subscribers, subscribersIteratable] = subscriptions.get(id)!;

            subscribers.add(ws);
            subscribersIteratable.add(ws);
            subscribedIDs.push(id);
        }

        ws.send({
            event: "subscribed",
            topic,
            topic_id: subscribedIDs,
        });
    }

    public async unsubscribe(ws: ISocketClient, topic: ESocketTopic | string, topicId: string | string[]) {
        topic = convertSafeEnum(ESocketTopic, topic);

        const subscriptions = this.#subscriptions.get(topic);
        if (!subscriptions) {
            return;
        }

        topicId = TypeUtils.isArray(topicId) ? topicId : [topicId];
        for (let i = 0; i < topicId.length; ++i) {
            const id = topicId[i];
            const subscriberSet = subscriptions.get(id);
            if (!subscriberSet) {
                continue;
            }
            const [subscribers, subscribersIteratable] = subscriberSet;

            subscribers.delete(ws);
            subscribersIteratable.delete(ws);
        }

        ws.send({
            event: "unsubscribed",
            topic,
            topic_id: topicId,
        });
    }

    public async unsubscribeAll(ws: ISocketClient) {
        for (let i = 0; i < this.#subscriptions.size; ++i) {
            const topic = Array.from(this.#subscriptions.keys())[i];
            const subscriptions = this.#subscriptions.get(topic);
            if (!subscriptions) {
                continue;
            }

            subscriptions.forEach(([subscribers, subscribersIteratable]) => {
                subscribers.delete(ws);
                subscribersIteratable.delete(ws);
            });
        }
    }
}

const Subscription = new _Subscription();

export default Subscription;
