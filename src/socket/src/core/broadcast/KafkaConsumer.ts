import { BROADCAST_URLS, CACHE_URL, PROJECT_NAME } from "@/Constants";
import BaseConsumer from "@/core/broadcast/BaseConsumer";
import JsonUtils from "@/core/utils/JsonUtils";
import Terminal from "@/core/utils/Terminal";
import { Consumer, Kafka } from "kafkajs";
import { createClient } from "redis";

class KafkaConsumer extends BaseConsumer {
    #client: Kafka;
    #consumer!: Consumer;
    #redisClient!: ReturnType<typeof createClient>;

    constructor() {
        super();

        this.#client = new Kafka({
            brokers: BROADCAST_URLS,
        });
    }

    public async start() {
        this.#consumer = this.#client.consumer({
            groupId: PROJECT_NAME,
            allowAutoTopicCreation: true,
            sessionTimeout: 30000,
            retry: {
                restartOnFailure: async (error) => {
                    Terminal.red("Kafka Consumer Error", error, "\n");
                    return true;
                },
            },
        });
        await this.#consumer.connect();

        this.#redisClient = await createClient({
            url: CACHE_URL,
        })
            .on("error", (err) => Terminal.red("Redis Client Error", err, "\n"))
            .connect();

        const topics = this.getEmitterNames();
        for (let i = 0; i < topics.length; ++i) {
            const topic = topics[i];
            await this.#consumer.subscribe({ topic, fromBeginning: true });
        }

        await this.#consumer.run({
            eachMessage: async ({ topic, message }) => {
                if (!message.value) {
                    return;
                }

                try {
                    const decoder = new TextDecoder("utf-8");
                    const model = JsonUtils.Parse(decoder.decode(message.value));
                    if (!model) {
                        return;
                    }

                    const cacheKey = model.cache_key;
                    if (!cacheKey) {
                        return;
                    }

                    const cachedData = await this.#redisClient.get(cacheKey);
                    let data;
                    if (cachedData) {
                        const cachedModel = JsonUtils.Parse(cachedData);
                        if (cachedModel) {
                            data = cachedModel;
                        }
                    }

                    if (!data) {
                        return;
                    }

                    await this.emit(topic, data);
                } catch (error) {
                    Terminal.red(`Kafka Consumer: Error processing message on topic ${topic}`, error, "\n");
                    return;
                }
            },
        });
    }

    public async stop() {
        await this.#redisClient?.quit();
        await this.#consumer?.disconnect();
    }
}

export default KafkaConsumer;
