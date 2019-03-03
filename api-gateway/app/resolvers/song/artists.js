import { flow, map, filter } from "lodash/fp";

export default async function songArtistsResolver(obj, _args, context) {
  if (obj.artistIds.length === 0) {
    return [];
  }

  // We fetch an index page for each timeline.
  // This is batched inside the Song model into a multiindex.
  const response = await context.models.artist.getMany(obj.artistIds);

  // Response could include optionals, so we filter out invalid artists and then unwrap.
  return flow(
    filter(optional => optional.isSome()),
    map(optional => optional.must()),
    map(artist => artist.data())
  )(response);
}
