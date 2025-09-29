import { CACHE_URL } from "@/Constants";
import BaseCache from "@/core/caching/BaseCache";
import Logger from "@/core/utils/Logger";
import { Utils } from "@langboard/core/utils";
import { createClient } from "redis";

type TRedisClient = ReturnType<typeof createClient>;

class RedisCache extends BaseCache {
    #redisClient!: TRedisClient;

    public async get<T>(key: string): Promise<T | null> {
        await this.#setClient();

        const cachedData = await this.#redisClient.get(key);
        let data;
        if (cachedData) {
            const cachedModel = Utils.Json.Parse(cachedData);
            if (cachedModel) {
                data = cachedModel;
            }
        }

        return data ?? null;
    }

    public async has(key: string): Promise<bool> {
        await this.#setClient();

        const exists = await this.#redisClient.exists(key);
        return exists > 0;
    }

    public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        await this.#setClient();

        if (ttl && ttl > 0) {
            await this.#redisClient.setEx(key, ttl, JSON.stringify(value));
            return;
        }

        await this.#redisClient.set(key, JSON.stringify(value));
    }

    public async delete(key: string): Promise<void> {
        await this.#setClient();

        await this.#redisClient.del(key);
    }

    public async clear(): Promise<void> {
        await this.#setClient();

        await this.#redisClient.flushAll();
    }

    public async stop(): Promise<void> {
        await this.#redisClient?.quit();
    }

    async #setClient() {
        this.#redisClient = await createClient({
            url: CACHE_URL,
            pingInterval: 10000,
        })
            .on("error", (err) => Logger.red("Redis Client Error", err, "\n"))
            .connect();
    }
}

export default RedisCache;
