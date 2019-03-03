<img width="200" alt="The Kapost Logo" src="https://user-images.githubusercontent.com/1911028/53699498-e5304980-3db6-11e9-944b-8ebdbe6cf6af.png">

This project was open-sourced by [Kapost](https://kapost.com), a content operations and marketing platform developed in beautiful Boulder, CO. [We're hiring—join our team!](https://kapost.com/join-our-team/)

# GraphQL API Gateway

This project is an example API Gateway over GraphQL, implemented with [Apollo Server 2](https://www.apollographql.com/docs/apollo-server/). The API Gateway here is a service that proxies and resolves requests to join data from different services. In this example, we join data over REST-like JSON APIs from two different example back-end services—`service1` and `service2`. In this example, we show some performance and safety mechanisms used to provide data in a consistent shape under a strongly-typed GraphQL schema ready for clients to use. See the `service1` and `service2` READMEs to see what the mock API endpoints look like.

This API Gateway implementation shows examples of HTTP caching, error formatting, model organization, defending against bad data, mocking data, and tracking over statsd.  It also includes tools for easily mocking portions of queries with different sets of mock data. This allows front-end developers to independently build features while other service APIs are still being developed; and can serve as a predictable, non-changing data set for apps when integration testing. We hope this code can serve as a reference to you to implement some of these features as you become familiar with Apollo Server.

This code is provided as-is without some things to be production ready. We note that this example does not include things like query scoring or rate limiting, and assumes being behind a proxy in production as it does not protect against malicious headers or attempt to rate limit. The routing is also hardcoded and would need to be adjusted for real deployment. It does not have an implementation for connections or schema stitching, but these features shouldn't be too difficult to add with the [Apollo Server docs](https://www.apollographql.com/docs/apollo-server/).

Table of Contents:

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [GraphQL API Gateway](#graphql-api-gateway)
  - [Getting Started](#getting-started)
    - [ENV flags for development](#env-flags-for-development)
    - [Building queries](#building-queries)
    - [Fetching from clients](#fetching-from-clients)
      - [Browser / NodeJS](#browser-nodejs)
      - [Ruby](#ruby)
    - [Error handling](#error-handling)
    - [Mocking data for development](#mocking-data-for-development)
    - [Exporting entire schema](#exporting-entire-schema)
  - [Development](#development)
    - [Key concepts and definitions](#key-concepts-and-definitions)
    - [Adding and extending schema](#adding-and-extending-schema)
      - [Custom scalars](#custom-scalars)
      - [Designing Input Schema](#designing-input-schema)
    - [Resolving data](#resolving-data)
      - [By example](#by-example)
      - [Resolving Enums](#resolving-enums)
      - [Resolving Unions and Interfaces](#resolving-unions-and-interfaces)
    - [Models](#models)
      - [Response objects](#response-objects)
      - [Batching](#batching)
      - [Memoizing By Arguments](#memoizing-by-arguments)
      - [Transforming (with mappers)](#transforming-with-mappers)
    - [Defense and Optionals](#defense-and-optionals)
    - [Deprecation (versioning)](#deprecation-versioning)
    - [Protecting / Scoring against malicious queries](#protecting-scoring-against-malicious-queries)
  - [Advanced Development](#advanced-development)
    - [Caching with HTTP Proxying](#caching-with-http-proxying)
    - [Memoization and Stable Hashing of Deep Objects](#memoization-and-stable-hashing-of-deep-objects)
    - [Query Introspection with the AST](#query-introspection-with-the-ast)
    - [Custom Error Formatting](#custom-error-formatting)
    - [Logging](#logging)
    - [Other things to consider](#other-things-to-consider)

<!-- /TOC -->


## Getting Started

You should have `node@>=8.11` and `redis` installed. Ensure you do not use older versions of node with (you can manage node versions across projects with `asdf`, `nodenv`, `nvm` or `n`). If you have installed `redis` through homebrew or other package managers, it should just work while running on the default ports with no additional configuration. You should set the `REDIS_URL` variable (with username, ports, passwords, etc) in your `.env.local` if you need any different config.

Once installed, running the app is as simple as:

```sh
yarn install
yarn start
```

This will serve the `/graphql` endpoint. You can also go to the GraphQL Playground (if `NODE_ENV !== production`) at [`localhost:3080`](http://localhost:3080).

<img width="1183" alt="Sceenshot of the GraphQL Playground" src="https://user-images.githubusercontent.com/1911028/53699084-823cb380-3db2-11e9-9b3b-f9ce9511206b.png">

### ENV flags for development

We provide a few flags for testing and debugging various aspects of the server.

* `DEBUG_REQUESTS=1`
    * Logs out requests by each async time step
* `DEBUG_EXTENSIONS=1`
    * Adds all extensions to output, including tracing information. Turn this on to see performance timing for resolvers.
* `MOCK_SERVER=1`
    * Turns on mocks for the entire schema (no resolvers will run)
* `MOCK_MISSING_RESOLVERS=1`
    * Mocks out data from any resolvers that are not present (useful for new development)
* `DISABLE_HTTP_CACHE=1`
    * Prevent caching any cacheable HTTP requests.


You can run these by setting the env flag before `yarn start`, i.e.

```sh
DEBUG_REQUESTS=1 MOCK_MISSING_RESOLVERS=1 yarn start
```

### Building queries

All GraphQL queries and mutations start from special types called `query` and `mutation`. You can start by querying any field on one of these types and continuing down until you have selected "terminal", scalar fields. For example, we may query the field `currentUser` with a query like the following.

```graphql
query FetchUserProfile {
  currentUser {
    name
    avatarURL
  }
}
```

Similarly, a mutation can be fired in the same way.

```graphql
mutation CreateRandomPlaylist {
  createRandomizedPlaylist(title: "My playlist") {
    id
    title
  }
}
```

You should be able to view all available query and mutation fields through the GraphiQL documentation viewer.

You may see valid queries in the wild that do not have the `query` keyword, or else are missing the documenting name (anonymous queries).

```graphql
{
  currentUser {
    name
    avatarURL
  }
}

query {
  currentUser {
    name
    avatarURL
  }
}
```

In general, prefer always including both the keyword and name, since we can use the given name to monitor query performance and counts.

For most client queries, you will need to query with run-time variables rather than hardcoding values in the query. You can do this by adding typed arguments to the root query and using them within. Ensure you match the type signatures of the query arguments to the field arguments.

```graphql
query CreateRandomPlaylist($title: String!) {
  createRandomizedPlaylist(title: $title) {
    id
    title
  }
}
```

The GraphQL Playground has an area for adding query variables as JSON. For an more in-depth guide
on writing queries (including other query features), please review the [official query GraphQL tutorial](https://graphql.org/learn/queries/).

<img width="1528" alt="Another screenshot of the playground with query variables open" src="https://user-images.githubusercontent.com/1911028/53699085-823cb380-3db2-11e9-8814-193e9206cdd5.png">


### Fetching from clients

This GraphQL service is served over HTTP, which means there is _no_ requirement to use anything other than HTTP calls. We can ask for GraphQL data simply by using libraries such as `axios` or `fetch`. There are several popular GraphQL client libraries that have sophisticated features such as client-side caching and GraphQL query batching. These libraries or similar ideas may be used if they fit into an existing react/redux stack, but existing HTTP fetching abstractions will work as well.

#### Browser / NodeJS

The GraphQL endpoint is served as a `POST` endpoint on `/graphql`. You need to provide the following post data:

* `query` — the text of the GraphQL query
* `variables` — (optional) a JSON object of query variables provided

Additionally, you will need to provide authorization in the form of a browser cookie, JWT (`Authorization` header), or basic auth API tokens (also the `Authorization` header).

An example with axios:

```js
axios.request({
  endpoint: "/graphql",
  method: "POST",
  data: {
    query: "query MyQuery {\n...\n}\n",
    variables: {
      pageSize: 4,
    },
  },
})
```

If configured in webpack or other bundlers, you could also import `.graphql` files in our front-end apps to avoid defining large queries in JavaScript strings.

```js
import myQuery from "./queries/myQuery.graphql";

axios.request({
  endpoint: "/graphql",
  method: "POST",
  data: {
    query: myQuery,
  },
})
```

#### Ruby

Just like JavaScript, you can fire a HTTP POST request with whatever networking solutions you have in your app already. There are also some GraphQL clients that can fire requests with nicer features such as the [`graphql-client` gem](https://github.com/github/graphql-client). If you are looking for other options, remember you are looking for a GraphQL _client_ library and not building another GraphQL server.

### Error handling

Type of errors

* Network errors (? status code)
* Server errors 500 (entire query missing)
* Resolver errors (per-field errors)
    * HTTP errors (401, 403, 404)
    * API Gateway proxy errors (400)
    * Unexpected errors

Since the GraphQL response undertakes many sub-requests, it can often be more work to parse apart all the various possible error states. Thankfully, a fairly naive approach to all of these errors is usually good enough. From a client's perspective, it often makes sense to bucket these errors into the following categories:

* Lost network connection
* Failed (with or without retry)
* Missing data (may or may not be ok depending on path)

Naively, we can usually escalate missing data to failed. Since GraphQL is strongly typed, this means we will have an errors object.


When there are errors, a GraphQL response may look like this. The stacktrace and message will be omitted in production to avoid leaking information to consumers.

<img width="1332" alt="Screenshot of GraphQL HTTP errors" src="https://user-images.githubusercontent.com/1911028/53699124-fe36fb80-3db2-11e9-9982-71308f4fd607.png">

GraphQL is strict and will cut off data when there are errors in type matching. If there are multiple error objects, you may be able to use a partial response depending on your use case. _Remember that a 200 status code for a GraphQL request may still mean there were proxy HTTP errors!_ Always check for a `errors` key in response.

For most use cases, the following pseudocode is appropriate for bucketing errors in clients for user action:

* If the axios request does not have data / status
    * Network error (please try again, internet down) or retry
* 400/500 status from `/graphql` request
    * Service error
* Any errors object?
    * Any HTTP 401 error
        * Unauthenticated Error
    * Any HTTP 403 error
        * Unauthorized Error
    * Any HTTP 404 error
        * NotFound Error
    * Other
        * Service error

We recommend extracting this error handing logic into a shared function / package to avoid repeating this same error handling in your clients.

### Mocking data for development

As mentioned above, you can mock out data with the `MOCK_SERVER=1` or `MOCK_MISSING_RESOLVERS=1` env variables. When present, the `graphql-tools` library will simulate building types. All types can be emulated automatically. Custom scalars will need to be defined under the `mocks` folder.

Note that you can also build a "temporary" resolver for new work that simply returns a fixture or some generated object while working on new development.

For more info on how mocking works in `graphql-tools`, please review [their documentation](https://www.apollographql.com/docs/graphql-tools/mocking.html).

### Exporting entire schema

If you have a use for the full GraphQL schema, you can export statically with `yarn run export:schema`. The outputted file will be available as `schema.graphql` at the root. This may be useful in future for tooling, type checking in editors, or schema stitching.

## Development

Before developing, we recommend going through the GraphQL Tutorials on [their official site](https://graphql.org/).

### Key concepts and definitions

* Query (uppercase)
    * The special root `type` in GraphQL schema which is the start of all GraphQL fetches. This is what you write to _define_ what data types are available.
* `query` (lowercase)
    * A client side query (with optional variables) that is sent and resolved to return data. This is what you write to get data for clients.
* Mutation — depending on context can mean either:
    * The special root `type` in GraphQL schema which is the start of all GraphQL fetches
* `mutation` (lowercase)
    * A client side mutation (with optional variables) that is sent and resolved to return data. This is what you write to mutate and then return data from clients.
* Subscription
    * A special root `type` that represents a query that continually streams back to the client over a protocol such as websockets.
* Resolver
    * A function that returns the proper data for a given ParentType -> field relationships. This function has a constant signature of `(obj, args, context, info)`.
* Obj
    * First argument to resolvers which is the parent object (if given)
* Args
    * Second argument to resolvers which includes all field arguments given (matching the types from the schema).
* Context
    * Third argument including any data / models / etc that is instantiated _per request_.
* Context Args
    * Rarely, you need to pass down arguments or config down to a future resolver. To do this, we include a special object under `context.args` for this purpose.
* Info
    * Fourth argument for advanced usage. Includes the query AST which can be used for schema introspection.
* Model
    * An abstraction that represents a way to fetch data in a performant way. Methods are defined to fire requests, batch them via dataloader, and are memoized when possible.
* Mock
    * An "alternate" resolver that can return mock data. Currently, the entire server can be automatically mocked or just missing resolvers.
* Mapper
    * A utility file of common translations for resolvers. Intended to be used with `lodash/fp`'s `flow`.
* Defense
    * A pattern for removing inconsistent data (bad referential integrity) with Datadog monitoring. Typically used in response or Model objects
* Optional
    * A wrapper for responses that may not return. Models should return data wrapped in optionals to ensure that calling resolvers must unwrap it with `must`, `maybe`, or `match`.
* Connector
    * An abstraction over different data access mechanisms. We currently have just one for HTTP, but could in future have other connectors for a database, memory cache, websocket, etc.
* Memoization
    * A way of improving performance by only calling a method once and storing the result if called again. This service heavily uses this pattern through `memoizationByArgs`, which does an efficient deepEquals on all arguments to cache calls during a request.
* Tracing
    * Data that is provided through the `apollo-server` package. It automatically times each resolver and returns timing data to help identify slow areas.

### Adding and extending schema

Again, we recommend going through the [official schema guide](https://graphql.org/learn/queries/) to understand the major language syntax and keywords.

At it's core, GraphQL schema is simply a collection of type definitions. There are core, basic types called scalars. Examples of built-in scalars include `ID`, `Boolean`, `Int`, and `String`. Developers can build up a rich set of types by composing these scalars into grouped object types with the `type` keyword. In addition to `type`s, other definitions can be made including:

* `scalar` — A keyword to define make additional scalars. Custom scalars must include a JS definition for parsing and serializing.
* `enum` — A set of named, constant options. Should always be in UPPER_CASE.
* `union` — A way of combining types into a set of possible types for polymorphic types and lists of different types
* `interface` — Another way of combining types, where a base type is defined and can be extended via `implements`

GraphQL schemas also require separate type definitions around any `input` types that are used for field arguments. These are defined with the `input` keyword. Currently (in GraphQL 0.13), the `input` type is considerably more limited in definition and can only include scalars, other input types, and enums. This will likely be extended in an upcoming spec update.

GraphQL also includes a specification for _directives_, which are attributes you can attach to type field. Most common is the `@deprecated` directive, which signals that the field is a candidate for removal and should be not be used going forward.

#### Custom scalars

Scalars are good for representing "terminal" data in custom shapes—usually we don't want to make objects scalars. For example, we add the `URL`, `Date`, and `DateTime` scalars to represent strings with special, specifically-defined shapes.

#### Designing Input Schema

GraphQL requires separate Input types for any objects that are passed into field arguments. These types are defined with the `input` keyword and can be composed like other types.

In general, try to keep the inputs and outputs as close together as possible but omit denormalized data in the input version.

### Resolving data

Resolvers represent how to get data on schema fields, or the _edges_ of the graph. We define `ParentType -> field` relationships which define how to get data for each field requested. These are functions of the following shape:

```js
function resolver(obj, args, context, info) {
  // return field data in shape of schema
}
```

where

* `obj` is the parent object, if available
* `args` is an object of field arguments, if any
* `context` is an request-wide object that can contain anything (model instances, loggers)
* `info` is an advanced object that contains the full query AST for advanced use


Resolvers can be async to fetch data from external locations (via models) and generally following a pattern similar to the below.

```js
async function resolver(obj, args, context, info) {
  const data = await context.models.something.get();
  return transform(data);
}
```

Apollo-server (the package running the resolution program) will properly halt with async resolvers. You do not need to worry about HTTP errors as they will automatically propagate up to the request runner and are formatted via `formatError`. All resolvers will be called, so you can debounce requests with a tool like `dataloader` in the model (see [Models](#models)).

In a lot of cases, it's good to have resolvers return results in a one-to-one shape with the GraphQL schema. This allows you to use implicit resolver that is provided when no resolver for the `ParentType -> field` pair is given. This default is essentially an identity function where it tries to access the field name on the parent object.

#### By example

For example, if you had schema like the following:

```graphql
type UserProfile {
  name: String!
  avatarURL: String!
}
```

and had a resolver that return an object like the following:

```js
// Query.userProfile resolver
function resolver(_obj, _args, _context, _info) {
  return { name: "Colorado River", picture: "http://placekitten.com/200/200" };
}
```

you would _not_ need to write a resolver for `UserProfile.name`. You would need to add a resolver for `UserProfile.avatarURL` though:

```js
// UserProfile.avatarURL resolver
function resolver(obj, _args, _context, _info) {
  return obj.picture;
}
```

Better yet, you could translate at the node for some fields:

```js
// Query.userProfile resolver
import { mapKeys } from "utility/mappers";

function resolver(_obj, _args, _context, _info) {
  const result = { name: "Colorado River", picture: "http://placekitten.com/200/200" };
  return mapKeys({ name: null, picture: "avatarURL" })(result);
}
```

and then remove the `UserProfile.avatarURL` resolver. Remember that resolvers should be consistent in their parent object down different fetch paths so you should think through the intermediate resolver return shapes.


#### Resolving Enums

When resolving an enum, ensure that the string you return from JavaScript matches the enum exactly (capitalized).

```graphql
enum Color {
  DARK_BLUE
  PUMPKIN_ORANGE
  # ...
}
```

```js
function resolver(_obj, _args, _context) {
  return "DARK_BLUE";
}
```

#### Resolving Unions and Interfaces

When you have a polymorphic type like a union or interface, you must define a special resolver on the type to resolve the actual type. For example, if we had a union like the following:

```graphql
type Song {
  # ...
}

type Podcast {
  # ...
}

union Audio = Song | Podcast
```

We would need to resolve this with a special type resolver with the following shape (no arguments).

```js
function resolveType(obj, context, info) {
  return obj.type === "song" ? "Song" : "Podcast";
}
```

The return value must be the type name (properly capitalized). To add to the set of resolvers, you must put this under a `Type.__resolveType` relationship.

```js
// audio/index.js
import resolveType from "./resolveType";


export default {
  __resolveType: resolveType,
};
```

### Models

To access data from APIs, we use an abstraction called a Model to represent a resource to fetch from another service. Models encapsulate different API calls and are a place to memoize, batch together requests, and return API results in a nice `Response` object for consistent access.

#### Response objects

Different services (and even the same service) end up returning responses in inconsistent shapes. For example, paginated `service1` responses are in the following shape:

```js
{
  "response": [/* ... */],
  "page_info": {
    page_size: 5,
    current: 1,
    previous_page: null,
    next_page: 2,
    total: 21,
    total_pages: 5
  }
}
```

where `service2` has a different shape. Rather than return raw objects, we use a `Response` base class that defines some core methods to get the `data` block and `pagination` block. It defaults to camelCasing your response and has different ways of access the data within.

Methods on `Response` instances:

* `data()`
    * Returns the camelCased "actual data" from the response
* `headers()`
    * Returns the camelCased headers from the response
* `pagination()`
    * If available on the Response subclass, will return the camelCased pagination data (transformed into GraphQL shapes for convenience)
* `keyBy(key, path?)`
    * returns the object keyed by a properly like lodash. If a path is given it will key by an object within.
* `find(key, value, path?)`
    * Similar to `keyBy`, it does an efficient lookup under some `key`, matching by `value`. If a path is given the search will be under that path.

Properties on `Response` instances:

* `raw`
  * If necessary, this is the raw, un-camelized response. You generally shouldn't need this.


All the response methods are memoized by arguments (meaning the result is stored for any arguments that are deep equals). This means we can `keyBy` with ease without worrying about calling repetitively over many resolvers.

When interacting with new services, you should add a subclass if necessary to encapsulate the response. Additionally, for some responses that return arrays via batches, models can map responses for each individual result that still has the pageInfo and headers for consistent access.

#### Batching

There are frequently cases where resolvers in a list need to fetch from the API but it would be prohibitively expensive to fire an individual request within sub-query resolver. To keep resolvers simple and one-to-one, we use a tool called `DataLoader` in models to essentially debounce and combine requests into one batch. This is a JS library from Facebook, but please use the helper in `utility/createDataLoader` to ensure that we batch by deep equals for arguments.

Typically, you would use data loader instance within a class to batch together `get` and `getMany` methods like the following. Additionally, DataLoader will cache any fetched items so you will be able to immediately get back an item that has been fetched during the request already.


```js
const MAX_BATCH_SIZE = 200;
class MyModel {
  constructor(connector) {
    this.connector = connector;
    this.myDataLoader = createDataLoader(this.batchFetch, {
      maxBatchSize: MAX_BATCH_SIZE,
    });
  }

  get = (id) => {
    return this.myDataLoader.load(ids);
  }

  getMany = (ids) => {
    return this.instanceMemberLoader.loadMany(ids);
  }

  // private

  batchFetch = (ids) => {
    return (
      this.connector.get("api/something", { params: { ids } })
      .then(newClassItems(MyResponse))
      .then(map(optional.fromNullable))
    );
  }
}
```

This will ensure that `batchFetch` is only called after all other resolvers have run synchronously, via a type of "defer" within via Promise scheduling.

For more info on DataLoader:

* [Library](https://github.com/facebook/dataloader)
* [Source Walkthrough Video from author Lee Byron](https://www.youtube.com/watch?v=OQTnXNCDywA)


#### Memoizing By Arguments

In some models, it may not make sense to use data loader but you may still want to memoize. This helper ensures that for any set of arguments that deep equal, a previous result will be returned if computed already.

Example:

```js
import memoizeByArgs from "utility/memoizeByArgs";

class Playlist {
  constructor(connector, { logger }) {
    this.connector = connector;
    this.logger = logger;
    this.get = memoizeByArgs(this.get);
  }

  get = (report) => {
    return (
      this.connector
        .get(ENDPOINT, { data: report })
    );
  }
}
```

This helper is also useful for `Response` objects and other helpers.

#### Transforming (with mappers)

Very often you will need to transform responses from other services into the shape of GraphQL schema. You can do this in two places—the model response and the resolver. Err on the side of transforming in the resolver unless the response is generic (for example, transforming pagination keys in the response makes sense as it's common).

We provide some common translation helpers in `utility/mappers.js` including:

* `logIdentity(prefix = "")(x)`
    * Small helper to log out data in the middle of a flow for debugging.
* `mapNameToTitle(key = "name")(itemOrList)`
  * Common helper to change the name key (can be configured to also map other keys like "label")
* `mapKeys(mapping)(itemOrList)`
    * Helper that maps key names, where mapping is an object of `originalKey: newKey` pairs. Note that any keys not in the mapping _will not_ be in the returned objects.
* `mapValue(key, mapping)(itemOrList)`
    * Helper which maps values of a single key. Helpful for translating enums
* `camelize(omittedPaths = [])`
    * Helper to do a "smart" camelize that will only translate keys that are not "id like" or in a blocklist. You are unlikely to need this as it is already part of the base `Model` class.

Note that all of these mappers are higher order functions (curryable functions) so that they work nicely with `flow`.

While not a requirement, a lot of resolvers benefit from using the `flow` and mapping helpers in `lodash/fp` to easily transform objects in a "pipeline". For example:

```js
import { flow, map, filter } from "lodash/fp";

import { mapNameToTitle } from "utility/mappers";

return flow(
  filter(optional => optional.isSome()),
  map(optional => optional.must()),
  map(item => item.data()),
  mapNameToTitle(),
)(optionalResponses);
```

### Defense and Optionals

When proxying data, you must prepare for cases where data you expect is not returned (usually due to referential integrity bugs). We take a general strategy of "omitting" the data (like we may have done in the front-end before) and ensuring that we monitor when data references are unavailable.

Two patterns exist for this use case. The first, `Defense` helpers, are used to clean up inconsistent data and track to Datadog. The other, `Optional`, is a wrapper object that is used to ensure consumers of a model consider what should happen if data is unavailable.

Defense files will vary based on the issue, so look at others to get an idea of how to clean up data while tracking. In general, defense should take place in `Response`s or `Model`s so that resolvers only need to deal with optionals. Please review the [`optional`](./app/utility/optional.js) source file for the full documentation.

### Deprecation (versioning)

Unlike APIs where we can version and release new endpoints, we instead mark fields as `@deprecated` via the given GraphQL directive.

For example, we might replace the avatar url:

```graphql
type UserProfile {
  id: ID!
  avatarSet: AvatarResolutions!
  avatarURL: URL! @deprecated(reason: "Move to using avatarSet to explicitly choose image size")
}
```

The GraphQL Playground tools will display the field as deprecated so it's clear that the field should not be used going forward.

<img width="1528" alt="Screenshot of deprecated field in GraphQL Playground schema explorer" src="https://user-images.githubusercontent.com/1911028/53699086-823cb380-3db2-11e9-841c-2ea493232e9d.png">


### Protecting / Scoring against malicious queries

_Not implemented in this example_

See [Apollo's query cost and depth limiting](https://blog.apollographql.com/securing-your-graphql-api-from-malicious-queries-16130a324a6b) for ideas on how to implement this. Github's GraphQL endpoint has [a great scoring and query limiting system](https://developer.github.com/v4/guides/resource-limitations/) to draw ideas from.

## Advanced Development

### Caching with HTTP Proxying

This service respects proxy cache headers and caches any allowed API responses in redis. The HTTPConnector caching strategy is to work similarly to a browser where items can be stored if allowed by the caching headers:

We follow the [HTTP spec](https://tools.ietf.org/html/rfc7234) for proxy caching with headers. Since we always request with Authorization headers, we simply respect the cache-control header rules when Authorization headers are present. While we could use another off-the-shelf proxy service such as Squid or Varnish, the caching mechanism in redis is simple and it's nice to avoid another network hop.

The API Gateway will always revalidate cached items (usually getting a 304 from the upstream response) to ensure:

* That the resource has not changed
* That the user (still) has authorization to see the resource

For more details, see [the heavily commented source](https://github.com/kapost/graphql-api-gateway/blob/master/api-gateway/app/connectors/http/cacheControl.js). In general, if a resource is cacheable by a proxy you should return headers with one of the following:

```text
cache-control: "must-revalidate"
cache-control: "public"
cache-control: "s-maxage" // not max age
```

We typically use `must-revalidate` in our APIs. This header MUST be present or this service will not cache per the spec. Rails apps will need to ensure this is added to their controller responses.

When cached, this service will request with `"If-Modified-Since": ${lastModified}` and/or `If-None-Match: ${etag}` headers to allow the backend to return 304s.

Remember you can disable caching with the `DISABLE_HTTP_CACHE=1` debug ENV variable.

Our example `service1` sets `Cache-Control: must-revalidate` to show this functionality off. ETags and 304s are automatically sent by express, calculated from the response shape (via `res.json`). In your APIs, you could avoid some expensive database operations by cleverly implementing cache control by checking cheaper queries or implementing some other cache mechanism.

### Memoization and Stable Hashing of Deep Objects

In general, using the `memoizeWithArgs` helper is all you need for most development. However, we discuss the internals here for debugging and reference.

For deep equals, we end up using a fast (native) hash algorithm coupled with a "stable stringify" to ensure that objects that are deep equal will always have matching hashes. This can be seen [in the source of `utility/hashKey`](https://github.com/kapost/graphql-api-gateway/blob/master/api-gateway/app/utility/hashKey.js). We use the 128-bit version of the hash to balance performance and odds of collision. For more discussion of potential hash algorithms, we recommend [this medium post "In Search of  Good NodeJS Hashing Algorithm"](https://medium.com/@drainingsun/in-search-of-a-good-node-js-hashing-algorithm-8052b6923a3b)

The stable keys are used for storing cached requests in redis, where the key is the hash of all relevant request data. They are also used for memoization of function calls in models and dataloader.

### Query Introspection with the AST

For advanced use-cases, it can be necessary to perform GraphQL query introspection when resolving. For example, we may need to know what fields in a nested query to properly resolve.

To do this, you can use the fourth argument `info` to access the query's abstract syntax tree (AST). By default, you will be given the current node under `info.fieldNodes` but also have access to the entire query.

This object is advanced and we recommend using this medium article ["Demystifying the `info` Argument in GraphQL Resolvers"](https://blog.graph.cool/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a) to go through all the types you need to find. In general, you will dig into fieldNodes recursively through `selectionSet.selection` to find what you need in the query by name.

As a rule of thumb, looking any further than one node ahead is discouraged as it's a sign of a bad resolution strategy.


### Custom Error Formatting

Currently we automatically add special attributes to errors in GraphQL responses via the `formatError` config.

The GraphQL spec ensures that the special key `extensions` with the error object will not collide with future functionality. We use this to mark errors with data. Currently we only distinguish between HTTP errors (with `errors.extensions.http`) and unexpected errors.


### Logging

We have an instance of logger provided on `context` that should be available during a request (includes request context for easy lookup). This logger can be extended with more data. See [the source](https://github.com/kapost/graphql-api-gateway/blob/master/api-gateway/app/server/logger.js) for more details.

### Other things to consider

This example does not include everything, but there are some obvious things to look at next:

* Connections
* Schema stitching
    * While HTTP may be adequate for all APIs, if we end up with any other services using GraphQL, we could use schema stitching to combine schema and resolver over GraphQL in both services.
