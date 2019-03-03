import _ from "lodash";
import uuid from "uuid/v4";

import baseLogger from "server/logger";

import config from "./config/env";
import schema from "./schema";

import createAxiosInstance from "./connectors/api/createAxiosInstance";
import HTTPCachingConnector, { crossUserCacheBy } from "./connectors/httpCachingConnector";

import Args from "./context/args";

import { CROSS_USER_CACHEABLE_MODELS, PER_USER_CACHEABLE_MODELS } from "./models/index";

import authHeaders from "./server/authHeaders";
import responseTracking from "./server/responseTracking";
import errorTracking from "./server/errorTracking";

const EXTENSIONS_DATA_KEY = "extensions";

function instantiateModels(modelObj, connector, logger) {
  return _.mapValues(modelObj, (Klass) => new Klass(connector, { logger }));
}

export function formatResponse(apiConfig) {
  return (response, options) => {
    responseTracking(response, options, apiConfig);
    return config.debugExtensions ? response : _.omit(response, EXTENSIONS_DATA_KEY);
  };
}

function buildApiConfig(req) {
  return {
    host: config.host,
    origin: req.get("origin"),
    requestId: req.get("x-request-id") || uuid(),
    authHeaders: authHeaders(req),
  };
}

function buildContext({ req }) {
  const apiConfig = buildApiConfig(req);

  const logger = baseLogger.extend({
    host: apiConfig.host,
    origin: apiConfig.origin,
    requestId: apiConfig.requestId,
  });

  // This connector caches similarly to a browser, by user (using GraphQL request info).
  const httpConnector = new HTTPCachingConnector(apiConfig, { logger });

  // This connector caches _across_ users, so only use for instance level APIs
  // (settings, schema, etc).
  const crossUserHttpConnector = new HTTPCachingConnector(apiConfig, {
    logger,
    cacheBy: crossUserCacheBy,
  });

  // Models are instantiated per request and are the mechanism to query data while
  // wrapping responses into classes and memoizing when possible.
  return {
    apiConfig,
    logger,
    args: new Args(),
    models: {
      ...instantiateModels(CROSS_USER_CACHEABLE_MODELS, crossUserHttpConnector, logger),
      ...instantiateModels(PER_USER_CACHEABLE_MODELS, httpConnector, logger),
    },
  };
}

export default buildContext;
