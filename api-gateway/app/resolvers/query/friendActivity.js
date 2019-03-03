import { flow, map, reject } from "lodash/fp";

import { mapKeys, mapNameToTitle } from "utility/mappers";

// We use our mapKeys helpers to transform keys and omit unlisted.
const KEY_MAPPING = {
  userId: "friend",
  songId: "listenedTo",
  playlistId: "fromPlaylist",
  timestamp: "at",
};

async function friendResolver(obj, _args, context) {
  const response = await context.models.user.get(obj.friend);

  return response.match({
    Some: (user) => user.data(),
    None: () => null,
  });
}

async function songResolver(obj, _args, context) {
  const response = await context.models.song.get(obj.listenedTo);

  return response.match({
    Some: (song) => song.data(),
    None: () => null,
  });
}

const rejectBadActivity = reject(listen => !listen.friend || !listen.listenedTo);

export default async function friendActivityResolver(_obj, _args, context) {
  const response = await context.models.friendActivity.index();

  // We map keys to get into the shape of our GraphQL schema
  const data = flow(
    mapKeys(KEY_MAPPING),
  )(response.data());

  // We optimistically fetch the users and songs for this activity as our schema guarentees
  // they are present. If there are any missing ones from our backend, we strip them out here.
  //
  // Other strategies include creating nullable fields or resolving to different unioned values
  // if no data is found. It depends on what is best for the schema you want to provide.
  const [friends, songs] = await Promise.all([
    Promise.all(data.map(x => friendResolver(x, null, context))),
    Promise.all(data.map(x => songResolver(x, null, context))),
  ]);

  const resolvedData = data.map((friendActivity, i) => {
    return { ...friendActivity, friend: friends[i], listenedTo: songs[i] };
  });

  return rejectBadActivity(resolvedData);
}
