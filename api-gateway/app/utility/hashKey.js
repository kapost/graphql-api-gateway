import { isString } from "lodash";

import stringify from "safe-stable-stringify";
import { murmurHash128 } from "murmurhash-native";

// A stable, sorted key hashing function so that any deep-equal object
// will match. Currently it is simply a near JSON.stringify for objects,
// which could get large in memory. If this is a concern, we could find a
// fast hash algo to standardize memory consumption.
export function stableStringKey(key) {
  return isString(key) ? key : stringify(key);
}

// We hash the stableStringKey through a consistent, fast hash algorithm.
// We use the 128bit version to ensure collisions are near impossible.
// Function picked by suggestion in this article:
// https://medium.com/@drainingsun/in-search-of-a-good-node-js-hashing-algorithm-8052b6923a3b
export default function hashKey(key) {
  return murmurHash128(stableStringKey(key));
}
