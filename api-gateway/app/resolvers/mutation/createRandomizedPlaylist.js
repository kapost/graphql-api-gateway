import { mapNameToTitle } from "utility/mappers";

export default async function createRandomizedPlaylistResolver(_obj, args, context) {
  // Example of API massaging: have to translate name/title back.
  const response = await context.models.playlist.createRandomizedPlaylist({ name: args.title });
  return mapNameToTitle()(response.data());
}
