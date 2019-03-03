/* eslint-disable no-console, no-unused-expressions */

import _ from "lodash";

export const OMITTED_PATHS = [];

const DIGITS = /^\d+/i;
const BSON_ID = /^[a-f\d]{24}$/i;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/i;

export const idLike = key => DIGITS.test(key) || BSON_ID.test(key) || UUID.test(key);

const mapKeysObj = mapping => (obj) => {
  const newObject = {};

  _.forEach(mapping, (value, key) => {
    newObject[value || key] = obj[key];
  });

  return newObject;
};

export const mapKeys = mapping => data => (
  _.isArray(data) ? data.map(mapKeys(mapping)) : mapKeysObj(mapping)(data)
);

export const mapNameToTitle = (key = "name") => data => (
  _.isArray(data) ?
    data.map(mapNameToTitle(key)) :
    _.omit({ ...data, title: data[key] || data.title }, key)
);

export const mapValue = (key, mapping) => data => (
  _.isArray(data) ? data.map(mapValue(key, mapping)) : { ...data, [key]: mapping[data[key]] }
);

export const transformKeys = (transformer) => (omittedPaths = OMITTED_PATHS, parent = "") => (data) => {
  if (_.isArray(data)) {
    return data.map(transformKeys(transformer)(omittedPaths, parent));
  } else if (_.isPlainObject(data)) {
    const newObj = {};

    _.forIn(data, (value, key) => {
      const path = `${parent}${parent.length > 0 ? "." : ""}${key}`;

      let newKey = key;
      let newValue = value;

      if (!_.includes(omittedPaths, path)) {
        newKey = idLike(key) ? key : transformer(key);
        newValue = transformKeys(transformer)(omittedPaths, path)(newValue);
      }

      newObj[newKey] = newValue;
    });

    return newObj;
  }

  return data;
};

export const camelize = (omittedPaths = OMITTED_PATHS, parent = "") => (data) => {
  return transformKeys(_.camelCase)(omittedPaths, parent)(data);
};

export const snakeCase = (omittedPaths = OMITTED_PATHS, parent = "") => (data) => {
  return transformKeys(_.snakeCase)(omittedPaths, parent)(data);
};

export const logIdentity = (prefix = "") => (x) => {
  prefix ? console.log(prefix, x) : console.log(x);
  return x;
};
