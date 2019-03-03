What are "defense" files? They are where we encapsulate cleaning up _bad data_ from various APIs. In the past, we were loose with bad data in the browser and opted to be defensive there. Since GraphQL is strongly typed and strict, we opt to remove bad values and alert with events whenever we have known inconsistencies. This has the benefit of allowing us to find problems in our data and allowing the browser to rely on good data from the API Gateway.

Defense functions clean at the API response or model--as soon as we know an API could return messed up values we clean up. This way resolvers can safely use the remaining data after we clean up in defense. Some APIs already do this, and ideally we can eventually remove all defense functions as we improve and replace APIs and work to clean up our data from mongo.

Defense files should always:

1. Only strip out bad values (i.e. null / invalid values).
    * Don't try to fix or join responses here. Missing data should be handled by models and resolvers (wrapped in optionals).
2. Log and fire statsd events whenever bad data is stripped so we can track inconsistencies.
    * Use the log level `warn`.
    * Use the specific statsd object for reporting.
    * Add logging data including:
        * The current endpoint
        * Host and origin from original request.
3. Immutably transform the `raw` data object for responses.
    * This object includes the following keys: `data`, `headers`, `status`, and `statusText`.
    * You don't need to be defensive since the only time this is called is on 200 / 304s with success.
    * Keys in `data` and `headers` are not yet camel-cased.
    * It should be returned in the same shape after changes.
4. Have full test coverage.
    * Bugs in these functions will cover up a lot of problems if incorrectly applied.
    * Use dependency injection for log/statsd object to ensure they are correctly reporting.

Note that resolvers could still break if they rely on bad values for data joining. We cannot reasonably deal with those errors in this service and they should be fixed by tracking down the bad data / API bugs upstream.
