const express = require("express");
const _ = require("lodash");
const faker = require("faker");

const app = express();
const port = 3091;

const PLAYLIST_SIZE = 50;
const USER_SIZE = 100;
const SONG_SIZE = 500;

function createRandomFriendActivity(timestamp) {
  return {
    id: faker.random.uuid(),

    // Playlist is optional and may not exist.
    playlist_id: _.random(1, 5) === 1 ? null : `playlist${_.random(1, PLAYLIST_SIZE - 1)}`,

    // User Id is required but may point to a bad/removed ID occationally due to referential
    // integrity issues.
    user_id: _.random(1, 10) === 1 ? "GARBAGE_ID" : `user${_.random(1, USER_SIZE - 1)}`,

    // Same with song id: can rarely point to an invalid song.
    song_id: _.random(1, 20) === 1 ? "GARBAGE_ID" : `song${_.random(1, SONG_SIZE - 1)}`,

    timestamp,
  };
}

// We build up pretend initial stream of your friend's music streaming.
// We intentionally build some with "bad" data, as this service may not have 100% referential
// integrity with service1.
let latestFriendActivity = _.reverse(_.sortBy(_.times(20, (i) => {
  return createRandomFriendActivity(faker.date.recent());
}), "at"));

// Finally, we set up a looping timeout that randomly adds another listen every 5-20 seconds.
function loopingFriendActivity() {
  latestFriendActivity = [
    createRandomFriendActivity(new Date()),
    ...latestFriendActivity.slice(0, -1)
  ];

  setTimeout(loopingFriendActivity, _.random(5000, 20000));
}

// Start the loop
loopingFriendActivity();

// And we serve it up.
app.get("/friend_activity/index", (req, res) => {
  return res.json({
    data: latestFriendActivity,
  });
});

app.listen(port, () => console.log(`Example service2 app listening on localhost:${port}!`));
