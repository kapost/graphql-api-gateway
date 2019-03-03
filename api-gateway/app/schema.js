import { makeExecutableSchema, addSchemaLevelResolveFunction, addMockFunctionsToSchema } from "apollo-server";

import config from "./config/env";

import resolvers from "./resolvers/index";
import mocks from "./mocks/index";
import typeDefs from "./schema/index";
import logger from "./server/logger";

// We build a valid GraphQLSchema with resolvers baked in, using the graphql-tools schema helper.
// This method assumes a valid ResolverMap as the resolvers argument, which maps schema types
// into injected resolvers. It will automatically inject scalar and value resolvers.
//
// See http://dev.apollodata.com/tools/graphql-tools/generate-schema.html
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  allowUndefinedInResolve: false,
  logger: config.nodeEnv === "production" ? { log: e => logger.error(e) } : console,
});

if (config.mockServer || config.mockMissingResolvers) {
  addMockFunctionsToSchema({
    schema,
    mocks,
  });
}

export default schema;
