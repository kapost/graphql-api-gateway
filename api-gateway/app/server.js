/* eslint-disable no-console */

import fs from "fs";
import path from "path";

import { ApolloServer } from "apollo-server";

import logger from "./server/logger";
import config from "./config/env";
import buildContext from "./buildContext";
import schema from "./schema";
import formatError from "./server/formatError";
import TrackingExtension from "./extensions/trackingExtension";

// Make sure we disconnect cleanly and run process.exit handlers
// when Heroku / CLI kills our process.
process.on("SIGINT", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

// Ensure we log out and report all unhandled promise errors
process.on("unhandledRejection", (reason) => {
  if (config.nodeEnv === "production") {
    logger.error(reason);
    // Good place to log to an error logging service like Honeybadger
  } else {
    console.log(reason);
  }
});

const server = new ApolloServer({
  schema,
  formatError,
  context: buildContext,
  tracing: true,
  extensions: [
    () => new TrackingExtension(),
  ],
  playground: {
    tabs: [
      {
        endpoint: "http://localhost:3080/graphql",
        name: "Example HomePage Query",
        query:  fs.readFileSync(path.join(__dirname, "..", "exampleQuery.graphql"), "utf8"),
      },
      {
        endpoint: "http://localhost:3080/graphql",
        name: "Example API Errors Query",
        query:  fs.readFileSync(path.join(__dirname, "..", "exampleHttpErrorQuery.graphql"), "utf8"),
      },
      {
        endpoint: "http://localhost:3080/graphql",
        name: "Example Mutation",
        query:  fs.readFileSync(path.join(__dirname, "..", "exampleMutation.graphql"), "utf8"),
        variables: JSON.stringify({ title: "My new random playlist" }, null, 2),
      },
    ],
  },
});

server.listen({ port: config.port }).then(({ url }) => {
  if (config.nodeEnv === "production") {
    logger.info(`🚀 GraphQL endpoint ready at ${url}graphql`);
  } else {
    console.log(`🚀 GraphQL endpoint and playground ready! Navigate to ${url}`);
  }
});
