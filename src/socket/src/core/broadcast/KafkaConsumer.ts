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
            clientId: `${PROJECT_NAME}-socket`,
            brokers: BROADCAST_URLS,
            retry: {
                retries: Number.MAX_SAFE_INTEGER,
                restartOnFailure: async (error) => {
                    Terminal.red("Kafka Client Error", error, "\n");
                    return true;
                },
            },
        });
    }

    public async start() {
        this.#consumer = this.#client.consumer({
            groupId: PROJECT_NAME,
            allowAutoTopicCreation: true,
        });

        while (true) {
            try {
                if (!this.#redisClient?.isOpen || !this.#redisClient?.isReady || this.#redisClient?.isClosed) {
                    this.#redisClient = await createClient({
                        url: CACHE_URL,
                        pingInterval: 10000,
                    })
                        .on("error", (err) => Terminal.red("Redis Client Error", err, "\n"))
                        .connect();
                }

                await this.#consumer.connect();

                const topics = this.getEmitterNames();
                await this.#consumer.subscribe({ topics, fromBeginning: true });

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

                break;
            } catch (error) {
                Terminal.red("Error starting consumer", error, "\n");
            }
        }
    }

    public async stop() {
        await this.#redisClient?.quit();
        await this.#consumer?.disconnect();
    }
}

export default KafkaConsumer;
