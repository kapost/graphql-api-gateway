import generateIdMismatchDefense from "./generators/missingIdMismatchDefense";

export default generateIdMismatchDefense(
  "Requested IDs that were not returned by the user multishow API",
  "user_missing",
);
