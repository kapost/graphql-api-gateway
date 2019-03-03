// An implementation of the Optional type, sometimes known as the Maybe or Option type.
//
// An instance of an option type is an optional value. Either it's `none`, or an
// instance of `Some`:
//
// ```javascript
// import optional from "utility/optional";
//
// const some = optional.some("Bob");
// const none = optional.none;
// ```
//
// A function that returns an optional string isn't that different from a function
// that returns a string or `null`. The advantage over null is that optionals
// provide a number of functions that help with manipulating optional values.
//
// ```javascript
//     function greet(user) {
//         return "Hello " + user.name().valueOrElse("Anonymous");
//     }
// ```
//
// Why bother in a dynamic language? We want to provide explicit objects that represent
// the common case of missing values. In this service, this is used as a signal that you should
// consider a result that may be missing (usually due to referential integrity). These Optionals
// provide several convenience methods to make it easy to explicitly consider if you should
// throw or handle missing values.
//
// For the curious: we implement in way most similar to swift, where you must specify how you
// access with `must` (!) or `maybe` (?). This implementation is mostly lifted from
// https://github.com/mwilliamson/node-options but with some API changes to be more strict with
// access (`must` vs `maybe`) and to add a couple more convenience methods.
//
// --------------------------------------------
// Functions (Ways to create / test Optionals)
// --------------------------------------------
//
// ### optional.some()
//
// * Yields a "some" optional that represents presense of a value. If undefined, an error will
// be thrown.
//
// ### optional.none
//
// * The none optional that represents lack of a value. Note that this is NOT a function but
// an instance of Optional.
//
// ### optional.isOptional(*value*)
//
// * `option.isOption(value)` returns `true` if `value` is `option.none` or `option.some(x)`.
//
// ### option.fromNullable(*value*)
//
// * If `value` is `null` or `undefined`, `option.fromNullable(value)` returns `option.none`.
// * Otherwise, returns `option.some(value)`.
//   For instance, `option.fromNullable(5)` returns `option.some(5)`
//
// --------------------------------------------
// Instance Methods
// --------------------------------------------
//
// ### match(*pattern*)
//
// A function that returns the result of the function.
// Throws an error if you don't provide the correct arguments.
//
// ```js
// match({ Some: (value) => { /* ... */ }, None: () => { /* ... */ } });
// ```
//
// * `some(value)` returns `pattern.Some(value)`
// * `none` returns `pattern.None()`
//
// ### maybe()
//
// A loose unwrap function. This does an optional unwrap where you get the internal value.
//
// * `some(value)` returns `value`
// * `none` returns `undefined`.
//
// ### must()
//
// A force unwrap function. Be careful with this method as it indicates you know if the value you
// expect should exist or make noise if not.
//
// * `some(value)` returns `value`
// * `none` throws an Error.
//
// ### isNone() and isSome()
//
// * `some(value).isNone()` returns `false`
// * `some(value).isSome()` returns `true`
// * `none.isNone()` returns `true`
// * `none.isSome()` returns `false`
//
// ### toArray()
//
// * `some(value).toArray()` returns `[some]`
// * `none.toArray()` returns `[]`
//
// ### orElse(*other*)
//
// Ensure that other returns anther Optional or an error will be thrown.
//
// If `other` is a function (`other` returning another option):
//
// * `some(value).orElse(other)` returns `some(value)`
// * `none.orElse(other)` returns `other()`
//
// If `other` is not a function (`other` returning another option):
//
// * `some(value).orElse(other)` returns `some(value)`
// * `none.orElse(other)` returns `other`
//
// ### valueOrElse(*other*)
//
// If `other` is a function:
//
// * `some(value).valueOrElse(other)` returns `value`
// * `none.valueOrElse(other)` returns `other()`
//
// If `other` is not a function:
//
// * `some(value).valueOrElse(other)` returns `value`
// * `none.valueOrElse(other)` returns `other`


/* eslint-disable class-methods-use-this */

import _ from "lodash";

function callable(x) {
  return _.isFunction(x) ? x() : x;
}

function validatePattern(pattern) {
  if (!pattern || !pattern.Some || !pattern.None) {
    throw new Error("`match` requires both pattern cases (`Some` and `None`)");
  }
}

class Optional {
  tap(callback) {
    callback(this.maybe());
    return this;
  }
}

class Some extends Optional {
  constructor(val) {
    super();

    if (_.isUndefined(val)) {
      throw new Error("Created an Optional.Some with `undefined`");
    }

    this.maybe = () => val;
  }

  must() {
    return this.maybe();
  }

  match(pattern) {
    validatePattern(pattern);
    return pattern.Some(this.maybe());
  }

  isNone() {
    return false;
  }

  isSome() {
    return true;
  }

  orElse = () => {
    return this;
  }

  valueOrElse = () => {
    return this.maybe();
  }

  toArray = () => {
    return [this.maybe()];
  }
}

class None extends Optional {
  maybe() {} // return undefined

  must() {
    throw new Error("Unwrapped an optional with `must` but it is `none`");
  }

  match(pattern) {
    validatePattern(pattern);
    return pattern.None();
  }

  isNone() {
    return true;
  }

  isSome() {
    return false;
  }

  orElse = (optionalOrFunc) => {
    const optional = callable(optionalOrFunc);

    if (!(optional instanceof Optional)) {
      throw new Error("Optional.orElse must return another optional");
    }

    return optional;
  }

  valueOrElse = (valOrFunc) => {
    return callable(valOrFunc);
  }

  toArray() {
    return [];
  }
}

function some(val) {
  return new Some(val);
}

const none = new None();

function isOptional(val) {
  return val === none || val instanceof Some;
}

function fromNullable(val) {
  if (_.isUndefined(val) || _.isNull(val)) {
    return none;
  }

  return new Some(val);
}

export default {
  some,
  none,
  isOptional,
  fromNullable,
};
