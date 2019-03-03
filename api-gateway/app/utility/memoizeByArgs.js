import fastMemoize from "fast-memoize";

import { stableStringKey } from "./hashKey";

export default function memoizeByArgs(fn) {
  return fastMemoize(fn, { serializer: stableStringKey });
}
