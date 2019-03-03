import _ from "lodash";
import { flow, map, flatten, compact, includes } from "lodash/fp";

import resolvers from "../resolvers/index";

function stringifyResolverPairs(collection) {
  return _.map(collection, (fields, type) => {
    // Ignore scalars; they don't need context args.
    if (_.isPlainObject(fields)) {
      return _.map(fields, (___, resolver) => `${type}.${resolver}`);
    }

    return null;
  });
}

const validKeys = flow(
  stringifyResolverPairs,
  flatten,
  compact,
  map(str => str.toLowerCase()),
)(resolvers);

function validateKey(key) {
  const lowerKey = key.toLowerCase();

  if (!includes(lowerKey)(validKeys)) {
    throw new Error(
      `Invalid resolver key \`${key}\` chosen for context args. The key must be a valid "type.resolver" string`
    );
  }

  return lowerKey;
}

function validateObject(object) {
  if (!_.isPlainObject(object)) {
    throw new Error(
      `Context args can only be set with plain objects. It was set with \`${object}\``
    );
  }

  return object;
}

class Args {
  constructor() {
    this.args = {};
  }

  get = (key) => {
    return this.args[validateKey(key)] || {};
  }

  extend = (key, args) => {
    const validKey = validateKey(key);
    validateObject(args);
    const existing = this.args[validKey] || {};
    this.args[validKey] = { ...existing, ...args };
  }
}

export default Args;
