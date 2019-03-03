// Pretend API that returns paged data.
// This service contains all the "core" data, including users, playlists, songs, and artists.

const express = require("express");
const _ = require("lodash");
const faker = require("faker");

const app = express();
const port = 3090;

app.use(express.json());

// We build some fake data. You would likely be querying a database instead.
const PLAYLISTS = _.times(50, (i) => ({
  id: `playlist${i}`,
  name: _.random(1, 2) === 1 ?
    `${_.capitalize(faker.commerce.color())} playlist ${i}` :
    `${faker.commerce.productAdjective()} playlist ${i}`,
  created_at: faker.date.past()
}));

const PLAYLISTS_BY_ID = _.keyBy(PLAYLISTS, "id");

const USERS = _.times(100, (i) => ({
  id: `user${i}`,
  name: faker.name.findName(),
  avatar_url: faker.image.avatar()
}));

const USERS_BY_ID = _.keyBy(USERS, "id");

const ARTISTS = _.times(500, (i) => ({
  id: `artist${i}`,
  name: faker.name.findName(),
  country: faker.address.country(),
  avatar_url: faker.image.avatar()
}));

const ARTISTS_BY_ID = _.keyBy(ARTISTS, "id");
const ARTIST_IDS = _.keys(ARTISTS_BY_ID);

const SONGS = _.times(500, (i) => ({
  id: `song${i}`,
  title: faker.random.words(),
  artist_ids: _.sampleSize(ARTIST_IDS, _.random(1, 3)),
  stream_url: `https://localhost/songs/stream/${faker.random.uuid()}`
}));

const SONGS_BY_ID = _.keyBy(SONGS, "id");

const PLAYLIST_SONGS = _.mapValues(_.keyBy(PLAYLISTS, "id"), () => (
  _.sampleSize(SONGS, _.random(5, 200)) // Random set of songs in each playlist
));


// We build a common set of request handlers. Here's a sample "paged" endpoint.
function pagedEndpoint(resources, params) {
  let { page_size: pageSize, page } = { page_size: 25, page: 1, ...params };

  pageSize = Number(pageSize) || 25;
  page = Number(page) || 1;

  const startIndex = pageSize * (page - 1);
  const endIndex = startIndex + pageSize;

  return {
    response: resources.slice(startIndex, endIndex),
    page_info: {
      page_size: pageSize,
      current: page,
      previous_page: startIndex > 0 ? page - 1 : null,
      next_page: endIndex < resources.length ? page + 1 : null,
      total: resources.length,
      total_pages: Math.ceil(resources.length / pageSize)
    }
  };
}

// We also build a sample multishow endpoint that simply looks up by ids.
// We shuffle and compact to show there is no guarentee the server will return all in any order.
// (this would likely be the case if you queried without special handling).
function multishowEndpoint(resourcesById, ids) {
  return {
    response: _.shuffle(_.compact(ids.map((id) => resourcesById[id])))
  };
}

// We route to both GET and POST to allow for big sets of parameters (like long ID arrays)
// to go over POST. We set headers allowing proxy caching in the API gateway for GET requests.
function route(path, handler) {
  app.route(path).get((req, res) => {
    res.set("Cache-Control", "must-revalidate");
    handler(req, res);
  }).post(handler);
}

// Finally, we setup some basic endpoints. We explicitly name them `index`, `multishow`, and
// `multiindex` for clarity, but in your APIs you may want more "RESTful" names.
route("/playlists/index", (req, res) => {
  return res.json(pagedEndpoint(PLAYLISTS, req.query));
});

route("/users/index", (req, res) => {
  return res.json(pagedEndpoint(USERS, req.query));
});

route("/songs/index", (req, res) => {
  return res.json(pagedEndpoint(SONGS, req.query));
});

route("/artists/index", (req, res) => {
  return res.json(pagedEndpoint(ARTISTS, req.query));
});

// We add an endpoint for the pretend current user as well.
route("/currentUser/show", (req, res) => {
  return res.json({ response: USERS_BY_ID.user5 });
})

// Multishow endpoints. Again, they do NOT guarentee order and 1-1 results.
route("/playlists/multishow", (req, res) => {
  const ids = req.query.ids;

  if (!ids) {
    return res.status(400).end("Missing `ids` parameter")
  }

  return res.json(multishowEndpoint(PLAYLISTS_BY_ID, ids));
});

route("/users/multishow", (req, res) => {
  const ids = req.query.ids;

  if (!ids) {
    return res.status(400).end("Missing `ids` parameter")
  }

  return res.json(multishowEndpoint(USERS_BY_ID, ids));
});

route("/songs/multishow", (req, res) => {
  const ids = req.query.ids;

  if (!ids) {
    return res.status(400).end("Missing `ids` parameter")
  }

  return res.json(multishowEndpoint(SONGS_BY_ID, ids));
});

route("/artists/multishow", (req, res) => {
  const ids = req.query.ids;

  if (!ids) {
    return res.status(400).end("Missing `ids` parameter")
  }

  return res.json(multishowEndpoint(ARTISTS_BY_ID, ids));
});

// Multiindex endpoints.
//
// This Multiindex DOES guarentee order and 1-1 results (empty array for missing ids).
//
// We could adjust the endpoint to accept an array of "params" for each index, but typically you
// share params such as the page size for all joined items in GraphQL.
//
// A generic multiindex could also take filtering/sorting params like an index route. If that was
// was the case, then we could avoid a specific key name like "playlist_ids", instead prefering an
// array of generic querying parameters.
route("/songs/multiindex", (req, res) => {
  const { playlist_ids: playlistIds } = req.query;

  if (!playlistIds) {
    return res.status(400).end("Missing `playlist_ids` parameter");
  }

  return res.json({
    responses: playlistIds.map((id) => (
      pagedEndpoint(PLAYLIST_SONGS[id] || [], req.query)
    ))
  });
});

// Post endpoint: creates a randomized playlist for an example mutation
route("/playlists/post", (req, res) => {
  const name = req.body.name;

  if (!name || name.length === 0) {
    return res.status(400).end("Name field is required.");
  }

  const ID = PLAYLISTS.length;
  const newPlaylist = {
    id: `playlist${ID}`,
    name,
    created_at: new Date()
  };

  // Pretend this is a database insert.
  PLAYLISTS.push(newPlaylist);
  // Random set of songs in each playlist
  PLAYLIST_SONGS[newPlaylist.id] = _.sampleSize(SONGS, _.random(5, 200));

  return res.json({ response: newPlaylist });
});

route("/400", (req, res) => {
  return res.status(400).end();
});

route("/403", (req, res) => {
  return res.status(403).end();
});

route("/404", (req, res) => {
  return res.status(404).end();
});

route("/500", (req, res) => {
  return res.status(500).end();
});

app.listen(port, () => console.log(`Example service1 app listening on localhost:${port}!`));
