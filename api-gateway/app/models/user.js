import _ from "lodash";
import { map } from "lodash/fp";

import memoizeByArgs from "utility/memoizeByArgs";
import createDataLoader from "utility/createDataLoader";
import { newClassItems } from "utility/newClass";
import optional from "utility/optional";

import { Service1ItemResponse } from "./responses/service1";
import missingUsersDefense from "./defense/missingUsersDefense";

// Normally you wouldn't hardcode the host in: you would want to pull it by host settings
// or rely on a proxy to route under relative paths such as `/service1/api`.
// Since our basic example uses multiple localhost ports, we hardcode.
const MULTISHOW_ENDPOINT = "http://localhost:3090/users/multishow";
const MAX_BATCH_SIZE = 200;
const LOGGER_INFO = {
  model: "USER",
  endpoint: MULTISHOW_ENDPOINT,
};

const sortByParamIds = (ids, logger) => (responses) => {
  const byId = _.keyBy(responses, res => res.data().id);
  missingUsersDefense(ids, _.keys(byId), logger);
  return ids.map(id => byId[id]);
};

export default class User {
  constructor(connector, { logger }) {
    this.connector = connector;
    this.logger = logger;

    this.get = memoizeByArgs(this.get);
    this.getMany = memoizeByArgs(this.getMany);

    this.userLoader = createDataLoader(this._multishow, {
      maxBatchSize: MAX_BATCH_SIZE,
    });
  }

  get = (id) => {
    return this.userLoader.load(id);
  }

  getMany = (ids) => {
    return this.userLoader.loadMany(ids);
  }

  // private

  _multishow = (ids) => {
    return (
      this.connector.get(MULTISHOW_ENDPOINT, { params: { ids } })
        .then(newClassItems(Service1ItemResponse))
        .then(sortByParamIds(ids, this.logger.extend(LOGGER_INFO)))
        .then(map(optional.fromNullable)) // we map into optionals as ids could be missing
    );
  }
}
