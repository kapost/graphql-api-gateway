import _ from "lodash";
import StatsD from "hot-shots";

import config from "../config/env";

// Replace reserved tag chars (: | @) with underscores.
function safe(value) {
  return `${value}`.replace(/:|\||@/g, "_");
}

// Format objects as StatsD tags `key:value`
export function tags(obj) {
  return _.map(obj, (value, key) => `${safe(key)}:${safe(value)}`);
}

export default function getStats(prefix = "", extraTags = {}) {
  return new StatsD({
    mock: true, // Unmock to report stats to a statsd provider
    host: config.statsdHost,
    port: config.statsdPort,
    prefix: `${config.app}.${prefix}`,
    globalTags: tags({
      ...extraTags,
      app: config.app,
      env: config.appEnv,
    }),
  });
}

export const defenseStats = getStats("defense.", {
  category: "defense",
});
