import { mapNameToTitle } from "utility/mappers";

export default async function playlistResolver(obj, _args, context) {
  if (!obj.fromPlaylist) {
    return null;
  }

  const response = await context.models.playlist.get(obj.fromPlaylist);

  // We may not have a value, so we unwrap the optional here.
  // Note how we are transfroming the name to title for the playlist here, just like we do
  // in the Query.playlists resolver. One could imagine extracting this to transform in a
  // specialized model response or some other common helper.
  return response.match({
    Some: (playlist) => {
      return mapNameToTitle()(playlist.data());
    },
    None: () => null,
  });
}
