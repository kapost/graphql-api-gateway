import _ from "lodash";

import config from "config/env";

import logger from "./logger";
import getStats, { tags } from "./statsd";

const EVENT_401 = "http_unauthorized";
const EVENT_403 = "http_forbidden";
const EVENT_404 = "not_found";
const UNHANDLED_RESOLVER_ERROR_EVENT = "unhandled_resolver_error";

const EVENTED_HTTP_ERRORS = {
  401: EVENT_401,
  403: EVENT_403,
  404: EVENT_404,
};

const stats = getStats("error.");

function httpRequestInfo(error) {
  const request = _.get(error, "originalError.request");
  const response = _.get(error, "originalError.response", {});

  if (!request) {
    return null;
  }

  return {
    path: request.path,
    method: request.method,
    responseData: response.data,
    status: response.status,
    statusText: response.statusText,
  };
}

function trackInfoHttpErrors(event, error, apiConfig) {
  const { message, path, locations } = error;

  logger.info({
    message,
    requestId: apiConfig.requestId,
    host: apiConfig.host,
    origin: apiConfig.origin,
    locations,
    path,
    resolverRequest: httpRequestInfo(error),
  });

  stats.event(
    event,
    "Non-critical HTTP error in resolver(s)",
    tags({
      requestId: apiConfig.requestId,
      message,
      path: (path || []).join("."),
    }),
  );
}

function trackUnexpectedErrors(error, apiConfig, httpStatus) {
  const { message, locations, path, _originalError, stack } = error;

  logger.error({
    message,
    requestId: apiConfig.requestId,
    host: apiConfig.host,
    origin: apiConfig.origin,
    locations,
    path,
    stack,
    resolverRequest: httpRequestInfo(error),
  });

  // honeybadger.notify(originalError, {
  //   context: {
  //     requestId: apiConfig.requestId,
  //     host: apiConfig.host,
  //     origin: apiConfig.origin,
  //     locations,
  //     path,
  //     resolverRequest: httpRequestInfo(error),
  //   },
  // });

  stats.event(
    UNHANDLED_RESOLVER_ERROR_EVENT,
    "Unexpected error in resolver",
    tags({
      requestId: apiConfig.requestId,
      message,
      http: httpStatus,
      path: (path || []).join("."),
    }),
  );
}

function errorTracking(error, apiConfig) {
  if (config.nodeEnv === "production") {
    const httpStatus = _.get(error, "error.originalError.response.status");
    const nonCriticalHttpError = EVENTED_HTTP_ERRORS[httpStatus];

    if (nonCriticalHttpError) {
      trackInfoHttpErrors(nonCriticalHttpError, error, apiConfig);
    } else {
      trackUnexpectedErrors(error, apiConfig, httpStatus);
    }
  }
}

export default errorTracking;
