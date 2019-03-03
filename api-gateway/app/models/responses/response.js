import _ from "lodash";
import { isArray, isPlainObject, keyBy } from "lodash/fp";

import { camelize } from "utility/mappers";
import memoizeByArgs from "utility/memoizeByArgs";

const unimplementedError = new Error("Method is unimplemented on base class");

function isCollection(value) {
  return isArray(value) || isPlainObject(value);
}

class Response {
  constructor(raw) {
    this.raw = raw;
    this.find = memoizeByArgs(this.find);
    this.keyBy = memoizeByArgs(this.keyBy);
    this.camelize = memoizeByArgs(this.camelize);
  }

  find = (key, value, path) => {
    return this.keyBy(key, path)[value];
  }

  keyBy = (key, path) => {
    const data = path ? _.get(this.data(), path) : this.data();

    if (!isCollection(data)) {
      throw new Error("cannot keyBy the data in this class");
    }

    return keyBy(key)(data);
  }

  // protected

  // Represents the main portion of the response. It should not include metadata,
  // instead subclasses should implement different methods.
  data = () => {
    throw unimplementedError;
  }

  headers = () => {
    return this.camelize().headers;
  }

  // private

  camelize = () => {
    return camelize()(this.raw);
  }
}

export default Response;
