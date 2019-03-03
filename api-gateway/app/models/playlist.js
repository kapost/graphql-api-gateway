import _ from "lodash";
import { map } from "lodash/fp";

import memoizeByArgs from "utility/memoizeByArgs";
import createDataLoader from "utility/createDataLoader";
import newClass, { newClassItems } from "utility/newClass";
import optional from "utility/optional";

import {
  Service1Response,
  Service1PaginatedResponse,
  Service1ItemResponse
} from "./responses/service1";

import missingPlaylistDefense from "./defense/missingPlaylistDefense";

// Normally you wouldn't hardcode the host in: you would want to pull it by host settings
// or rely on a proxy to route under relative paths such as `/service1/api`.
// Since our basic example uses multiple localhost ports, we hardcode.
const INDEX_ENDPOINT = "http://localhost:3090/playlists/index";
const MULTISHOW_ENDPOINT = "http://localhost:3090/playlists/multishow";
const POST_ENDPOINT = "http://localhost:3090/playlists/post";
const MAX_BATCH_SIZE = 200;
const LOGGER_INFO = {
  model: "PLAYLIST",
  endpoint: MULTISHOW_ENDPOINT,
};

const sortByParamIds = (ids, logger) => (responses) => {
  const byId = _.keyBy(responses, res => res.data().id);
  missingPlaylistDefense(ids, _.keys(byId), logger);
  return ids.map(id => byId[id]);
};

export default class Playlist {
  constructor(connector, { logger }) {
    this.connector = connector;
    this.logger = logger;

    this.get = memoizeByArgs(this.get);
    this.index = memoizeByArgs(this.index);
    this.playlistLoader = createDataLoader(this._multishow, {
      maxBatchSize: MAX_BATCH_SIZE,
    });
  }

  get = (id) => {
    return this.playlistLoader.load(id);
  }

  index = ({ page, pageSize }) => {
    const params = {
      page,
      page_size: pageSize,
    };

    return (
      this.connector
        .get(INDEX_ENDPOINT, { params })
        .then(newClass(Service1PaginatedResponse))
    );
  }

  createRandomizedPlaylist = (data) => {
    return (
      this.connector
        .post(POST_ENDPOINT, { data })
        .then(newClass(Service1Response))
    );
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
