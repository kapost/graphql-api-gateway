// The Redis server should be set to configured with the following eviction policy: `allkeys-lru`.
// We do not set expires on our cache results since we keep them and always revalidate on the
// original servers. See `https://redis.io/topics/lru-cache` for LRU caching details in Redis.

import { promisify } from "util";

import redis from "redis";

import env from "../../config/env";
import getStats, { tags } from "../../server/statsd";

const EVENT_CACHE_HIT = "cache_hit";
const EVENT_CACHE_MISS = "cache_miss";
const EVENT_CACHE_GET_FAILURE = "cache_get_failed";
const EVENT_CACHE_SET_FAILURE = "cache_set_failed";

let client;
let stats;
let getAsync;
let setAsync;

if (env.nodeEnv !== "test") {
  client = redis.createClient({ url: env.redisUrl });
  stats = getStats("redis_cache.");
  getAsync = promisify(client.get).bind(client);
  setAsync = promisify(client.set).bind(client);

  // Make sure we disconnect cleanly our client when app is going down.
  process.on("exit", () => {
    console.log("Disconnecting Redis client"); // eslint-disable-line no-console
    client.quit();
  });
}

// We store responses as simple JSON strings as we shouldnt need to manipulate responses in Redis.
class RedisCache {
  constructor(url = null) {
    this.statTags = tags({ url });
  }

  get = (key) => {
    return getAsync(key).then(JSON.parse).then(this.trackCacheHitMiss).catch((err) => {
      // We hide errors when the cache is broken, as the server should still be working without it.
      stats.event(EVENT_CACHE_GET_FAILURE, err.message, { alert_type: "error" }, this.statTags);
      return null;
    });
  }

  set = (key, val) => {
    return setAsync(key, JSON.stringify(val)).catch((err) => {
      // We hide errors when the cache is broken, as the server should still be working without it.
      stats.event(EVENT_CACHE_SET_FAILURE, err.message, { alert_type: "error" }, this.statTags);
      return null;
    });
  }

  // private

  trackCacheHitMiss = (cacheData) => {
    if (cacheData) {
      stats.increment(EVENT_CACHE_HIT, this.statTags);
    } else {
      stats.increment(EVENT_CACHE_MISS, this.statTags);
    }

    return cacheData;
  }
}

export default RedisCache;
