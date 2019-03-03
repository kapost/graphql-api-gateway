import _ from "lodash";

import getStats, { tags } from "./statsd";

const TRACING_PATH = "extensions.tracing";
const FALLBACK_OPERATION_NAME = "_anonymous";
const GRAPHIQL_QUERY = "IntrospectionQuery";
const QUERY_NAME_REGEX = /^\s*(?:query|mutation|subscription)\s*([^({\s]*)\s*/i;
const MUTATION_REGEX = /^\s*mutation/i;

const EVENT_MISSING_TRACING = "missing_tracing";
const STAT_FULL_QUERY_TIME = "full_query_time";
const STAT_SUB_QUERY_TIME = "sub_query_time";

const stats = getStats("graphql.");

// NOTE: Add subscriptions here.
function parseQueryType(query) {
  if (query.match(MUTATION_REGEX)) {
    return "mutation";
  }

  return "query";
}

export function parseOperationName(query) {
  const match = QUERY_NAME_REGEX.exec(query);

  if (match) {
    return match[1]; // first capture group
  }

  return FALLBACK_OPERATION_NAME;
}

function runResolutionTiming(trackingInfo, queryTags) {
  trackingInfo.execution.resolvers.forEach((trace) => {
    const subQueryTags = tags({
      subquery: 1,
      parent_type: trace.parentType,
      field_name: trace.fieldName,
      return_type: trace.returnType,
      resolver: `${trace.parentType}.${trace.fieldName}`,
    });

    stats.timing(STAT_SUB_QUERY_TIME, trace.duration, [...queryTags, ...subQueryTags]);
  });
}

// OperationName is the given name for a graphql query, which is optional.
// Our front-ends should provide these so we can track by operation name.
export default function responseTracking(response, { query, operationName }, { requestId }) {
  const safeOperationName = operationName || parseOperationName(query);

  if (safeOperationName === GRAPHIQL_QUERY) {
    return;
  }

  const queryType = parseQueryType(query);

  const queryTags = tags({
    requestId,
    queryId: requestId, // compat with old events
    queryType,
    operationName: safeOperationName,
  });

  const tracingInfo = _.get(response, TRACING_PATH);

  if (!tracingInfo) {
    stats.event(
      EVENT_MISSING_TRACING,
      "GraphQL response is missing time tracing data!",
      queryTags
    );
  }

  stats.timing(STAT_FULL_QUERY_TIME, tracingInfo.duration, queryTags);
  runResolutionTiming(tracingInfo, queryTags);
}
