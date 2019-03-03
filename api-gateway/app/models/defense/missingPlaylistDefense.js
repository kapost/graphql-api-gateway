import generateIdMismatchDefense from "./generators/missingIdMismatchDefense";

export default generateIdMismatchDefense(
  "Requested IDs that were not returned by the playlist multishow API",
  "playlist",
);
