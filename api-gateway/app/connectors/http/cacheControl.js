import { get } from "lodash";

// If these cache-control directives are ever present, we may not cache.
// https://tools.ietf.org/html/rfc7234#section-3.
const NO_CACHE_DIRECTIVES = /(private|no-store)/i;

// See https://tools.ietf.org/html/rfc7234#section-3.2.
// If we have a Authorization header (which we will assume we always do in this connector as we
// send that or a Cookie) then we may only cache if one of the following keys is present.
const CACHE_WITH_AUTH_DIRECTIVES = /((must-revalidate|public|s-maxage))/i;

// We follow the spec at https://tools.ietf.org/html/rfc7234.
// Since we assume we always have an Authorization header and we always revalidate on the
// original server, we can greatly simplify the logic necessary to determine cacheability and do not
// need to calcuate a max-age (since we never return a cache result without checking). We keep all
// cachable items indefinitely as a proxy (until the cache evicts by LRU policy).
//
// See https://tools.ietf.org/html/rfc7234#section-3.2 for the keys that allow caching when
// Authorized, and https://tools.ietf.org/html/rfc7234#section-3 to see the directives / rules that
// always disallow caching.
export function cacheableResponse(response) {
  const { "cache-control": cacheControl } = response.headers;

  return !NO_CACHE_DIRECTIVES.test(cacheControl) && CACHE_WITH_AUTH_DIRECTIVES.test(cacheControl);
}

// We use the If-Modified-Since and If-None-Match headers to allow the server an opportunity to 304
// by Date-Modified or ETag. (If both supported on the server, If-None-Match should have priority).
// https://tools.ietf.org/html/rfc7234#section-4.3.1
export function withCacheHeaders(requestConfig, cachedResponse) {
  const lastModified = get(cachedResponse, "headers.last-modified");
  const etag = get(cachedResponse, "headers.etag");

  return {
    ...requestConfig,
    headers: {
      ...(requestConfig.headers || {}),
      ...(lastModified ? { "If-Modified-Since": lastModified } : {}),
      ...(etag ? { "If-None-Match": etag } : {}),
    },
  };
}
