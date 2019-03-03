import { envFetch, envNumberFetch, envBooleanFetch, envEnumFetch } from "./helpers/envFetch";

const DEFAULT_PORT = 3080;

const nodeEnvironmentValues = [
  "development",
  "test",
  "production",
];

const appEnvironmentValues = [
  "development",
  "test",
  "staging",
  "production",
  "pull-request",
];

class Config {
  // Environment Config
  app = "api-gateway";
  appEnv = envEnumFetch("APP_ENV", appEnvironmentValues, "development");
  nodeEnv = envEnumFetch("NODE_ENV", nodeEnvironmentValues, "development");
  host = envFetch("HOST", "localhost");
  port = envNumberFetch("PORT", DEFAULT_PORT);
  statsdHost = envFetch("STATSD_HOST", "localhost");
  statsdPort = envNumberFetch("STATSD_PORT", 8125);
  redisUrl = envFetch("REDIS_URL", "redis://127.0.0.1:6379");


  // Env flags for altering / configuring behavior of the api gateway
  debugRequests = envBooleanFetch("DEBUG_REQUESTS", false);
  debugExtensions = envBooleanFetch("DEBUG_EXTENSIONS", false);
  mockServer = envBooleanFetch("MOCK_SERVER", false);
  mockMissingResolvers = envBooleanFetch("MOCK_MISSING_RESOLVERS", false);
  disableHTTPCache = envBooleanFetch("DISABLE_HTTP_CACHE", false);
}

export default new Config();
