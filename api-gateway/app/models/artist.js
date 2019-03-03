import _ from "lodash";
import { map } from "lodash/fp";

import createDataLoader from "utility/createDataLoader";
import { newClassItems } from "utility/newClass";
import optional from "utility/optional";
import memoizeByArgs from "utility/memoizeByArgs";

import { Service1ItemResponse } from "./responses/service1";
import missingArtistsDefense from "./defense/missingArtistsDefense";

// Normally you wouldn't hardcode the host in: you would want to pull it by host settings
// or rely on a proxy to route under relative paths such as `/service1/api`.
// Since our basic example uses multiple localhost ports, we hardcode.
const MULTISHOW_ENDPOINT = `http://localhost:3090/artists/multishow`;
const MAX_BATCH_SIZE = 200;
const LOGGER_INFO = {
  model: "ARTIST",
  endpoint: MULTISHOW_ENDPOINT,
};

const sortByParamIds = (ids, logger) => (responses) => {
  const byId = _.keyBy(responses, res => res.data().id);
  missingArtistsDefense(ids, _.keys(byId), logger);
  return ids.map(id => byId[id]);
};

export default class Artist {
  constructor(connector, { logger }) {
    this.connector = connector;
    this.logger = logger;

    this.get = memoizeByArgs(this.get);
    this.getMany = memoizeByArgs(this.getMany);
    
    this.artistLoader = createDataLoader(this._multishow, {
      maxBatchSize: MAX_BATCH_SIZE,
    });
  }

  get = (id) => {
    return this.artistLoader.load(ids);
  }

  getMany = (ids) => {
    return this.artistLoader.loadMany(ids);
  }

  _multishow = (ids) => {
    return (
      this.connector.get(MULTISHOW_ENDPOINT, { params: { ids } })
        .then(newClassItems(Service1ItemResponse))
        .then(sortByParamIds(ids, this.logger.extend(LOGGER_INFO)))
        .then(map(optional.fromNullable)) // we map into optionals as ids could be missing
    );
  }
}
