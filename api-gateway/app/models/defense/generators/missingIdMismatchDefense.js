import _ from "lodash";

import { defenseStats } from "server/statsd";

export default function generateIdMismatchDefense(message, statEvent) {
  return function defense(
    requestIds,
    responseIds,
    logger,
    stats = defenseStats,
  ) {
    const missingIds = _.difference(requestIds, responseIds);

    if (missingIds.length > 0) {
      logger.warn({
        message,
        missingIds,
        defense: true,
      });

      stats.increment(statEvent, missingIds.length);
    }
  };
}
