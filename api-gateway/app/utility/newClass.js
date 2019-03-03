import _ from "lodash";

// Super simple helper to make class instances in promise chains easier
export default function newClass(Klass, ...curryArgs) {
  return (...args) => new Klass(...args, ...curryArgs);
}

export const newClassItems = (Klass, {
  path = "data.response",
  keyName = "data",
} = {}) => (res) => {
  return _.get(res, path).map(data => (
    new Klass({ [keyName]: data, headers: res.headers })
  ));
};
