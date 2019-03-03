import DataLoader from "dataloader";

import hashKey from "./hashKey";

function createDataLoader(batchLoadFn, options = {}) {
  return new DataLoader(batchLoadFn, {
    cacheKeyFn: hashKey,
    ...options,
  });
}

export default createDataLoader;
