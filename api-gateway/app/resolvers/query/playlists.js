import { mapNameToTitle } from "utility/mappers";

export default async function playlistResolver(_obj, args, context) {
  const response = await context.models.playlist.index(args);
  return mapNameToTitle()(response.data());
}
