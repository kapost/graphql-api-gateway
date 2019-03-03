import { GraphQLExtension } from "apollo-server";

import responseTracking from "server/responseTracking";
import errorTracking from "server/errorTracking";

// Tracks errors and responses with requestId from context
export default class TrackingExtension extends GraphQLExtension {
  requestDidStart = ({ queryString, operationName }) => {
    this.query = queryString;
    this.operation = queryString;
  }

  willSendResponse = (args) => {
    const { context, graphqlResponse } = args;

    if (graphqlResponse.errors) {
      graphqlResponse.errors.forEach((err) => {
        errorTracking(
          err,
          context.apiConfig,
        )
      });
    }

    responseTracking(
      graphqlResponse,
      { query: this.query, operation: this.operation },
      context.apiConfig
    );
  }
}
