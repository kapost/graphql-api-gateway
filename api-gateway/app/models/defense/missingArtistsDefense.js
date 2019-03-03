import generateIdMismatchDefense from "./generators/missingIdMismatchDefense";

export default generateIdMismatchDefense(
  "Requested IDs that were not returned by the artist multishow API",
  "artist_missing",
);
