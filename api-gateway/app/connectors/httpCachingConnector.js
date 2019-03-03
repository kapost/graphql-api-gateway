import { pick, omit, get } from "lodash/fp";

import hashKey from "utility/hashKey";

import env from "../config/env";

import defaultCreateAxiosInstance from "./api/createAxiosInstance";
import RedisCache from "./cache/redis";
import { withCacheHeaders, cacheableResponse } from "./http/cacheControl";

// These attributes from the original GraphQL request are factored into the deep-equality cacheKey.
const CACHE_DEPENEDENCY_GRAPHQL_REQUEST_CONFIG = [
  "origin",
  "authHeaders",
];

// These attributes in the axios request are factored into the deep-equality cacheKey.
const CACHE_DEPENEDENCY_AXIOS_CONFIG = [
  "url",
  "baseUrl",
  "params",
  "data",
  "headers",
];

const ALLOWED_AXIOS_API = [
  ...CACHE_DEPENEDENCY_AXIOS_CONFIG,
  "method",
  "timeout",
];

const STORED_AXIOS_RESPONSE_KEYS = [
  "data",
  "headers",
  "status",
  "statusText",
];

// Do not modify unless you want to invalidate many items in cache.
const USER_INSTANCE_KEY = "__USER_INSTANCE_CONFIG";

// Helpers to pick/omit object keys appropriate for API / caching.
export const pickCachableGraphQLRequestHeaders = pick(CACHE_DEPENEDENCY_GRAPHQL_REQUEST_CONFIG);
export const pickCachableAxiosConfig = pick(CACHE_DEPENEDENCY_AXIOS_CONFIG);
export const pickAllowedAxiosConfig = pick(ALLOWED_AXIOS_API);
export const pickStoredAxiosResponse = pick(STORED_AXIOS_RESPONSE_KEYS);
const omitMethod = omit("method");
const getStatus = get("response.status");

// Uses the same information to cache by but omits the authorization key that
// is user specific. This allows requests to 304 across users.
export function crossUserCacheBy(requestConfig, graphqlRequestConfig) {
  return {
    ...pickCachableAxiosConfig(requestConfig),
    origin: graphqlRequestConfig.origin,
  };
}

// Returns the default cacheBy object includes all given request information AND
// user/origin/instance information. Any deep-equals objects should match to the same
// objects in the cache.
export function defaultCacheBy(requestConfig, graphqlRequestConfig) {
  return {
    ...pickCachableAxiosConfig(requestConfig),
    [USER_INSTANCE_KEY]: pickCachableGraphQLRequestHeaders(graphqlRequestConfig),
  };
}

// Promise.then helper to store in cache if necessary.
const cacheIfNecessary = (cache, cacheKey, logger) => async (response) => {
  const storedResponse = pickStoredAxiosResponse(response);

  if (cacheableResponse(response)) {
    logger.info({
      message: `Caching cacheable response from ${response.config.url}`,
      apiUrl: response.config.url,
    });

    await cache.set(cacheKey, storedResponse);
  }

  return storedResponse;
};

// Promise.catch helper to return cached item for 304s, if necessary.
const returnCachedResponseIfNecessary = (cachedResponse, logger) => (err) => {
  if (getStatus(err) === 304) {
    logger.info({
      message: `Received 304 from ${err.config.url}, returning cached result.`,
      apiUrl: err.config.url,
    });

    return cachedResponse;
  }

  throw err;
};

// Helper to check if an axios requestConfig is a GET request or not.
const isGetRequest = (requestConfig) => {
  return !requestConfig.method || requestConfig.method.toLowerCase() === "get";
};

// Connector that fires requests with a subset of the Axios instance API. It allows the caller to
// create different versions that can cache by a different object to allow different cache levels
// depending on requests (if they can be shared across users, for example).
//
// Note that the response object omits the original request attribute unlike Axios. This is
// intentional as that object cannot be stored in the cache and will not be returned on a cache hit.
//
// Note that the Cache object should act as a state singleton, as mulitple instances are made for
// tracking purposes but the state should persist across instances.
export default class HTTPCachingConnector {
  constructor(graphqlRequestConfig, {
    logger,
    cacheBy = defaultCacheBy,
    Cache = RedisCache,
    createAxiosInstance = defaultCreateAxiosInstance,
  } = {}) {
    this.graphqlRequestConfig = graphqlRequestConfig;
    this.Cache = Cache;
    this.cacheBy = cacheBy;
    this.logger = logger;
    this.api = createAxiosInstance(graphqlRequestConfig);
  }

  request = async (requestConfig) => {
    if (env.disableHTTPCache || !isGetRequest(requestConfig)) {
      return this.api.request(pickAllowedAxiosConfig(requestConfig)).then(pickStoredAxiosResponse);
    }

    const cache = new this.Cache(requestConfig.url);
    const cacheKey = hashKey(this.cacheBy(requestConfig, this.graphqlRequestConfig));
    const cachedResponse = await cache.get(cacheKey);

    return (
      this.api
        .request(withCacheHeaders(requestConfig, cachedResponse))
        .then(cacheIfNecessary(cache, cacheKey, this.logger))
        .catch(returnCachedResponseIfNecessary(cachedResponse, this.logger))
    );
  }

  get = (url, requestConfig = {}) => {
    return this.request(omitMethod({ ...requestConfig, url }));
  }

  post = (url, requestConfig = {}) => {
    return this.request({ ...requestConfig, url, method: "post" });
  }

  put = (url, requestConfig = {}) => {
    return this.request({ ...requestConfig, url, method: "put" });
  }

  delete = (url, requestConfig = {}) => {
    return this.request({ ...requestConfig, url, method: "delete" });
  }
}
