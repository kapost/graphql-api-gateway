This is a mock service that returns a list of your friend's music streaming activity (`FriendActivity`). It updates every 5-20 few seconds to emulate a real stream for a popular user.

It has just one endpoint: `/friend_activity/index`. It references resources in service1 but may have _bad_ references (`GARBAGE_ID`) in an attempt to simulate referential integrity woes.

GET: http://localhost:3091/friend_activity/index

```json
{
  "data": [
    {
      "id": "5f059370-0ae0-4dc4-868c-7f88b4cb8d80",
      "playlist_id": "playlist20",
      "user_id": "user23",
      "song_id": "GARBAGE_ID",
      "timestamp": "2019-02-23T19:01:54.736Z"
    },
    {
      "id": "9f20d45a-8d66-45ea-989c-9580fb5359f0",
      "playlist_id": "playlist3",
      "user_id": "user6",
      "song_id": "song165",
      "timestamp": "2019-02-23T19:01:34.936Z"
    },
    {
      "id": "b1dae8b2-9b4e-4313-88d8-0f97de053b79",
      "playlist_id": "playlist25",
      "user_id": "user45",
      "song_id": "song321",
      "timestamp": "2019-02-23T16:20:31.606Z"
    },
    {
      "id": "34506607-5520-4cc0-a342-898ebb4f0274",
      "playlist_id": "playlist8",
      "user_id": "user75",
      "song_id": "song231",
      "timestamp": "2019-02-23T05:28:08.410Z"
    },
    {
      "id": "3ff2a8a1-ccc0-4ab8-820d-1c68d3863916",
      "playlist_id": "playlist18",
      "user_id": "user12",
      "song_id": "GARBAGE_ID",
      "timestamp": "2019-02-23T09:18:55.664Z"
    },
    {
      "id": "a402f1cc-0dc3-4f6a-82a1-c80b2ee1fd40",
      "playlist_id": "playlist40",
      "user_id": "user6",
      "song_id": "song286",
      "timestamp": "2019-02-23T14:47:37.497Z"
    },
    {
      "id": "81f33d74-a259-4b86-ba01-350209406bfc",
      "playlist_id": null,
      "user_id": "user61",
      "song_id": "song14",
      "timestamp": "2019-02-23T00:13:14.919Z"
    },
    {
      "id": "bd979738-d84c-4392-a084-d8e06cfd7eb3",
      "playlist_id": "playlist20",
      "user_id": "user34",
      "song_id": "song154",
      "timestamp": "2019-02-23T05:38:43.653Z"
    },
    {
      "id": "ecf9b7cc-3094-4868-9b29-a68d67064fc7",
      "playlist_id": "playlist7",
      "user_id": "user59",
      "song_id": "song438",
      "timestamp": "2019-02-23T04:06:19.608Z"
    },
    {
      "id": "50e77e36-aae9-42cb-bd30-f02c6f98ba40",
      "playlist_id": null,
      "user_id": "user91",
      "song_id": "song374",
      "timestamp": "2019-02-23T04:34:51.515Z"
    },
    {
      "id": "775c6ea0-e6eb-4a59-8c98-eb283eff7086",
      "playlist_id": "playlist11",
      "user_id": "user60",
      "song_id": "song53",
      "timestamp": "2019-02-23T16:16:31.094Z"
    },
    {
      "id": "c563808a-aabe-416f-a28c-cff03d73a7d5",
      "playlist_id": null,
      "user_id": "user65",
      "song_id": "song430",
      "timestamp": "2019-02-23T17:13:01.583Z"
    },
    {
      "id": "4facb445-997a-4ec1-b037-956cf54a0f56",
      "playlist_id": "playlist24",
      "user_id": "user32",
      "song_id": "song184",
      "timestamp": "2019-02-23T10:50:35.740Z"
    },
    {
      "id": "b8dd4adf-d6fc-49bc-9808-68a166b9025c",
      "playlist_id": "playlist32",
      "user_id": "user15",
      "song_id": "song356",
      "timestamp": "2019-02-23T06:13:31.694Z"
    },
    {
      "id": "5272041a-88f6-4e46-9b56-7430907494ee",
      "playlist_id": "playlist43",
      "user_id": "GARBAGE_ID",
      "song_id": "song184",
      "timestamp": "2019-02-23T17:46:53.477Z"
    },
    {
      "id": "af009b9f-f1d6-4f65-9f00-955c5a252b0f",
      "playlist_id": "playlist15",
      "user_id": "user65",
      "song_id": "song254",
      "timestamp": "2019-02-23T09:16:34.643Z"
    },
    {
      "id": "a6a5430b-8a97-46d5-91e3-1b5a927ce236",
      "playlist_id": "playlist28",
      "user_id": "user55",
      "song_id": "song27",
      "timestamp": "2019-02-23T02:19:52.480Z"
    },
    {
      "id": "43884441-8f93-4ecf-8a94-7c608753d404",
      "playlist_id": "playlist18",
      "user_id": "GARBAGE_ID",
      "song_id": "song73",
      "timestamp": "2019-02-22T22:49:05.252Z"
    },
    {
      "id": "264a5c56-9e60-4817-997f-8f0901c81cbb",
      "playlist_id": "playlist44",
      "user_id": "GARBAGE_ID",
      "song_id": "song340",
      "timestamp": "2019-02-23T02:53:57.789Z"
    },
    {
      "id": "667d7131-6967-4c05-a725-700cc0d5be45",
      "playlist_id": "playlist31",
      "user_id": "user91",
      "song_id": "song309",
      "timestamp": "2019-02-23T03:16:15.747Z"
    }
  ]
}
```
