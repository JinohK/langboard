abstract class BaseCache {
    public abstract get<T>(key: string): Promise<T | null>;
    public abstract has(key: string): Promise<bool>;
    public abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
    public abstract delete(key: string): Promise<void>;
    public abstract clear(): Promise<void>;
    public abstract stop(): Promise<void>;
}

export default BaseCache;
