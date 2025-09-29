import { CACHE_TYPE } from "@/Constants";
import BaseCache from "@/core/caching/BaseCache";
import InMemoryCache from "@/core/caching/InMemoryCache";
import RedisCache from "@/core/caching/RedisCache";

let Cache: BaseCache;

switch (CACHE_TYPE) {
    case "redis":
        Cache = new RedisCache();
        break;
    case "in-memory":
    default:
        Cache = new InMemoryCache();
        break;
}

export default Cache;
