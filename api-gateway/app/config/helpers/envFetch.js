import _ from "lodash";

export function envFetch(key, fallback) {
  const value = process.env[key] || fallback;
  if (_.isUndefined(value)) {
    throw new Error(`Could not find value for required environment variable ${key}`);
  }

  return value;
}

export function envBooleanFetch(key, fallback) {
  const stringValue = envFetch(key, String(fallback));
  return (stringValue !== "false" && stringValue.length > 0);
}

export function envNumberFetch(key, fallback) {
  return Number(envFetch(key, String(fallback)));
}

export function envEnumFetch(envVar, allowedValues, fallback) {
  const value = envFetch(envVar, fallback);

  if (!allowedValues.includes(value)) {
    throw new Error(
      `Invalid NODE_ENV variable of value "${value}" passed in, must be one of [${allowedValues}].`
    );
  }

  return value;
}
