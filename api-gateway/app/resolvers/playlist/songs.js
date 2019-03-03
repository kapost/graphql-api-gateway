import { mapNameToTitle } from "utility/mappers";

export default async function playlistSongsResolver(obj, args, context) {
  // We fetch an index page for each timeline.
  // This is batched inside the Song model into a multiindex.
  const response = await context.models.song.index({ ...args, playlistId: obj.id });
  return response.data();
}
