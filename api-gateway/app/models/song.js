import _ from "lodash";
import { map } from "lodash/fp";

import createDataLoader from "utility/createDataLoader";
import { newClassItems } from "utility/newClass";
import optional from "utility/optional";
import memoizeByArgs from "utility/memoizeByArgs";

import { Service1ItemResponse, Service1PaginatedResponse } from "./responses/service1";
import missingSongsDefense from "./defense/missingSongsDefense";

// Normally you wouldn't hardcode the host in: you would want to pull it by host settings
// or rely on a proxy to route under relative paths such as `/service1/api`.
// Since our basic example uses multiple localhost ports, we hardcode.
const MULTISHOW_ENDPOINT = "http://localhost:3090/songs/multishow";
const MULTIINDEX_ENDPOINT = "http://localhost:3090/songs/multiindex";
const MAX_BATCH_SIZE = 200;
const LOGGER_INFO = {
  model: "SONG",
  endpoint: MULTISHOW_ENDPOINT,
};

const sortByParamIds = (ids, logger) => (responses) => {
  const byId = _.keyBy(responses, res => res.data().id);
  missingSongsDefense(ids, _.keys(byId), logger);
  return ids.map(id => byId[id]);
};

export default class Song {
  constructor(connector, { logger }) {
    this.connector = connector;
    this.logger = logger;

    this.get = memoizeByArgs(this.get);
    this.getMany = memoizeByArgs(this.getMany);
    this.index = memoizeByArgs(this.index);

    this.songLoader = createDataLoader(this._multishow, {
      maxBatchSize: MAX_BATCH_SIZE,
    });

    this.songIndexLoader = createDataLoader(this._multiindex, {
      maxBatchSize: MAX_BATCH_SIZE,
    });
  }

  get = (id) => {
    return this.songLoader.load(id);
  }

  getMany = (ids) => {
    return this.songLoader.loadMany(ids);
  }

  index = (args) => {
    return this.songIndexLoader.load(args);
  }

  _multishow = (ids) => {
    // Use post when we get to sizes that might go over the URL max character limit.
    const httpMethod = ids.length > 50 ? "post" : "get";

    return (
      this.connector[httpMethod](MULTISHOW_ENDPOINT, { params: { ids } })
        .then(newClassItems(Service1ItemResponse))
        .then(sortByParamIds(ids, this.logger.extend(LOGGER_INFO)))
        .then(map(optional.fromNullable)) // we map into optionals as ids could be missing
    );
  }

  _multiindex = (argsList) => {
    // We use the same pageSize/page for all index responses in the endpoint,
    // so we can just grab from the first.
    const params = {
      playlist_ids: argsList.map(args => args.playlistId),
      page_size: argsList[0].pageSize,
      page: argsList[0].page,
    };

    // Use post when we get to sizes that might go over the URL max character limit.
    const httpMethod = params.playlist_ids.length > 50 ? "post" : "get";

    // We create a response for each index (using a custom path to shape of multiindex response).
    return (
      this.connector[httpMethod](MULTIINDEX_ENDPOINT, { params })
        .then(newClassItems(Service1PaginatedResponse, { path: "data.responses" }))
    );
  }
}
