/* eslint-disable import/no-commonjs */

// We use commonjs here so that the schema can easily be built by a script without babel.

const fs = require("fs");
const path = require("path");

// We synchronously "import" from filesystem, just like a require call.
// Each file access is relatively insignificant to startup time as all other requires
// do the same thing.
export function requireSchema(schema) {
  return fs.readFileSync(path.join(__dirname, `${schema}.graphql`), "utf8");
}

module.exports = [
  requireSchema("scalars"),
  requireSchema("query"),
  requireSchema("mutation"),
  requireSchema("musicApp"),
  requireSchema("apiError"),
];
