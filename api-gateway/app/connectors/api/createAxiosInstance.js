/* eslint-disable no-console, import/no-extraneous-dependencies */
/* eslint-disable consistent-return, global-require */

import _ from "lodash";
import axios from "axios";

import config from "config/env";
import logger from "server/logger";

import packageJson from "../../../package";

const { version } = packageJson;

let colors;

if (config.debugRequests) {
  colors = require("colors");
}

const SAFE_LOG_KEYS = [
  "url",
  "baseUrl",
  "method",
  "data",
  "params",
];

const POTENTIALLY_SENSITIVE_KEYS = /(auth|password|token)/i;

function removeSensitiveData(object) {
  return _.mergeWith({}, object, (_objValue, _srcValue, key) => {
    if (POTENTIALLY_SENSITIVE_KEYS.test(key)) {
      return "[omitted]";
    }
  });
}

function createDebugLogger() {
  let requestCount = 0;

  function prerequest(requestConfig) {
    console.log(
      `Async Step ${requestCount += 1}: \t`,
      requestConfig.method,
      `${colors.white(requestConfig.url)} ${colors.dim(JSON.stringify(requestConfig, null, 2))}`
    );
    return requestConfig;
  }

  return prerequest;
}

function productionLogger(graphqlRequestConfig) {
  return (requestConfig) => {
    logger.info({
      message: "Resolver request",
      requestId: graphqlRequestConfig.requestId,
      origin: graphqlRequestConfig.origin,
      host: graphqlRequestConfig.host,
      ...removeSensitiveData(_.pick(requestConfig, SAFE_LOG_KEYS)),
    });

    return requestConfig;
  };
}

function addRequestDebugInterceptors(instance, requestId) {
  if (config.nodeEnv === "production") {
    instance.interceptors.request.use(productionLogger(requestId));
  }

  if (config.debugRequests) {
    instance.interceptors.request.use(createDebugLogger());
  }
}

function createAxiosInstance(graphqlRequestConfig) {
  const instance = axios.create({
    baseURL: `https://${graphqlRequestConfig.host}`,
    headers: {
      ...graphqlRequestConfig.authHeaders,
      Accept: "application/json",
      "user-agent": `GraphQL API Gateway Resolver ${version}`,
    },
  });

  addRequestDebugInterceptors(instance, graphqlRequestConfig);

  return instance;
}

export default createAxiosInstance;
