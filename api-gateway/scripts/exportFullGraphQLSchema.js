#!/usr/bin/env node

/* eslint-disable import/no-commonjs */

// Simple script that exports the full GraphQL schema to the root folder.

const fs = require("fs");
const path = require("path");

const schema = require("../app/schema/index").join("\n");

fs.writeFileSync(path.join(__dirname, "..", "schema.graphql"), schema);
