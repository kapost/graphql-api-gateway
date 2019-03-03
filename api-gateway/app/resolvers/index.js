import Scalars from "./scalars/index";
import Query from "./query/index";
import Mutation from "./mutation/index";

// We also import our custom types, with rolled up fields
import Playlist from "./playlist/index";
import Song from "./song/index";
import FriendListen from "./friendListen/index";
import ApiError from "./apiError/index";

// This resolver map is a flat type map, where a single layer of nesting represents the
// relationship (typeName -> fieldResolver). We roll up and register all types here.
//
// The GraphQL tools we are using will automatically resolve defined scalar fields (plain objects
// and fields that already match the necessary shape) by implicitly adding a default resolver for
// any fields not defined here. Not all types need to register custom resolvers. Thus, the types
// we provide here register only the field resolvers that need to fetch, mutate, or transform data.
// ------------------------------------------------------------------------------------------------
const resolvers = {
  // We spread all of the scalar types that we resolve here.
  ...Scalars,

  // Query and Mutation are the special "root" types in GraphQL that all  queries/mutations must
  // stem from.
  Query,
  Mutation,

  // All GraphQL types that need to register non-default field / type resolvers are rolled up here.
  Playlist,
  Song,
  FriendListen,
  ApiError,
};

export default resolvers;
