import Artist from "./artist";
import Playlist from "./playlist";
import User from "./user";
import CurrentUser from "./currentUser";
import Song from "./song";
import FriendActivity from "./friendActivity";
import ApiError from "./apiError";

// Endpoints that are cacheable just for one user. We use this to attempt to cache just like
// a browser.
//
// This caching is done by passing in a http connector in handleGraphQLRequest that caches like a
// browser would (respecting params and cachability headers).
export const PER_USER_CACHEABLE_MODELS = {
  user: User,
  currentUser: CurrentUser,
  friendActivity: FriendActivity,
  playlist: Playlist,
  apiError: ApiError,
};

// Endpoints/resources that are consistent across users can be cached for everyone,
// not just individuals! Usually this is public information or shared settings data for a group
// of users. In our example, songs and artists are generally public and unchanging based on user
// login.
//
// This caching is done by passing in a special http connector in handleGraphQLRequest that ignores
// the current user as part of the cache key.
//
// We still authenticate per user on every request by proxying auth, so don't worry about
// accidentally serving up data they shouldn't see. If a model is placed here when it's not truly
// cacheable across users, it will not cache and will be a waste of caching as it will replace the
// cache with each users' request.
export const CROSS_USER_CACHEABLE_MODELS = {
  song: Song,
  artist: Artist,
};
