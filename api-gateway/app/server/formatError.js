import _ from "lodash";
import config from "config/env";

// If an axios error, pull out HTTP error information we can forward.
function axiosErrorExtension(originalError) {
  const status = _.get(originalError, "response.status");
  const statusText = _.get(originalError, "response.statusText");

  if (status) {
    return { status, statusText };
  }

  return null;
}


export default function formatError(error) {
  const { message, locations, path, extensions, originalError } = error;
  console.log(error.message);

  const extendedExtensions = {
    ...(extensions || {}),
    http: axiosErrorExtension(originalError),
  };

  if (config.nodeEnv === "production") {
    delete extendedExtensions.exception;
  } else if (extendedExtensions.http) {
    // Pull out specific axios info to avoid serializing a circular object
    // https://github.com/apollographql/apollo-server/issues/1433
    extendedExtensions.exception = {
      stacktrace: extendedExtensions.exception.stacktrace,
      config: {
        url: extendedExtensions.exception.config.url,
        method: extendedExtensions.exception.config.method,
        params: extendedExtensions.exception.config.params,
      }
    }
  }

  // We return what is serialized to the client.
  return { message, locations, path, extensions: extendedExtensions };
}
