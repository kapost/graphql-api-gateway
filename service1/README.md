This is a service that serves pretend data for a music streaming service. Includes the following endpoints:

## Index endpoints

* `/playlists/index`
* `/songs/index`
* `/artists/index`
* `/users/index`

Takes `page` and `page_size` params.

## Multishow endpoints (returns an entity for each ID) (served over GET and POST)

* `/songs/multishow?ids[]=song1&ids[]=song99`
* `/artists/multishow?ids[]=artist6&ids[]=artist88`
* `/users/multishow?ids[]=user5&ids[]=user-13&user88`

Note that these results are not guaranteed to be returned in the same order (and missing values are removed).

## Multiindex endpoints (returns paged results for each ID) (served over GET and POST)

* `/songs/multiindex?playlist_ids[]=playlist4&playlist_ids=playlist8&page_size=5&page=1`

Returns a page of songs for each playlist_id. Page size and page params apply to all returned pages.

These results do guarantee that a response will be returned for each ID, even if just an empty array response.

See `api.js` for more comments.



## Examples:


### Index
GET `http://localhost:3090/songs/index?page_size=3&page=4`

```json
{
  "response": [
    {
      "id": "song9",
      "title": "architecture transform USB",
      "artist_ids": [
        "artist82",
        "artist122"
      ],
      "stream_url": "https://localhost/songs/stream/ede7f8e3-5203-4e26-97cb-241eaa1a6c2c"
    },
    {
      "id": "song10",
      "title": "Shores Accounts Home",
      "artist_ids": [
        "artist159",
        "artist476"
      ],
      "stream_url": "https://localhost/songs/stream/e4aea8eb-1ba3-435d-8f62-23513aa8ebe9"
    },
    {
      "id": "song11",
      "title": "Investment Account Tuna",
      "artist_ids": [
        "artist359"
      ],
      "stream_url": "https://localhost/songs/stream/f214912b-1511-41c7-9022-046087d8430c"
    }
  ],
  "page_info": {
    "page_size": 3,
    "current": 4,
    "previous_page": 3,
    "next_page": 5,
    "total": 500,
    "total_pages": 167
  }
}
```

### Multishow

GET `http://localhost:3090/users/multishow?ids[]=user2&ids[]=user999&ids[]=user77&ids[]=user52`

```json
{
  "response": [
    {
      "id": "user2",
      "name": "Junior Jacobi",
      "avatar_url": "https://s3.amazonaws.com/uifaces/faces/twitter/al_li/128.jpg"
    },
    {
      "id": "user77",
      "name": "Tanner King",
      "avatar_url": "https://s3.amazonaws.com/uifaces/faces/twitter/psaikali/128.jpg"
    },
    {
      "id": "user52",
      "name": "Reece Borer",
      "avatar_url": "https://s3.amazonaws.com/uifaces/faces/twitter/aviddayentonbay/128.jpg"
    }
  ]
}
```

### Multiindex

GET `http://localhost:3090/songs/multiindex?playlist_ids[]=playlist3&playlist_ids[]=playlist44&playlist_ids[]=GARBAGE_ID&page_size=3`

```json
{
  "responses": [
    {
      "response": [
        {
          "id": "song9",
          "title": "architecture transform USB",
          "artist_ids": [
            "artist82",
            "artist122"
          ],
          "stream_url": "https://localhost/songs/stream/ede7f8e3-5203-4e26-97cb-241eaa1a6c2c"
        },
        {
          "id": "song449",
          "title": "functionalities Direct Bedfordshire",
          "artist_ids": [
            "artist65",
            "artist0"
          ],
          "stream_url": "https://localhost/songs/stream/893d11a1-744b-45d7-a0b8-2ded64c834eb"
        },
        {
          "id": "song358",
          "title": "Awesome Cotton Table",
          "artist_ids": [
            "artist478",
            "artist339",
            "artist49"
          ],
          "stream_url": "https://localhost/songs/stream/beb33609-32fb-468f-94e2-ceecb22e47bf"
        }
      ],
      "page_info": {
        "page_size": 3,
        "current": 1,
        "previous_page": null,
        "next_page": 2,
        "total": 6,
        "total_pages": 2
      }
    },
    {
      "response": [
        {
          "id": "song489",
          "title": "invoice Gorgeous Steel Bike Bedfordshire",
          "artist_ids": [
            "artist136"
          ],
          "stream_url": "https://localhost/songs/stream/4c61286b-6f09-4034-9af3-1d51863b35b9"
        },
        {
          "id": "song466",
          "title": "Summit",
          "artist_ids": [
            "artist370",
            "artist105",
            "artist288"
          ],
          "stream_url": "https://localhost/songs/stream/f0199f84-3aff-41f6-bfb0-5a9ab1a06a2b"
        },
        {
          "id": "song427",
          "title": "Checking Account seize Cross-platform",
          "artist_ids": [
            "artist242",
            "artist495",
            "artist217"
          ],
          "stream_url": "https://localhost/songs/stream/f7998d4c-2886-4ce7-b2af-56a4e377dc13"
        }
      ],
      "page_info": {
        "page_size": 3,
        "current": 1,
        "previous_page": null,
        "next_page": 2,
        "total": 25,
        "total_pages": 9
      }
    },
    {
      "response": [],
      "page_info": {
        "page_size": 3,
        "current": 1,
        "previous_page": null,
        "next_page": null,
        "total": 0,
        "total_pages": 0
      }
    }
  ]
}
```
