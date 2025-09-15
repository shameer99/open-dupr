# DUPR API Guide for Open DUPR Implementation

## Overview

This guide documents the key DUPR API endpoints needed for the Open DUPR MVP implementation. All endpoints require HTTPS and use the base URL: `https://api.dupr.gg/`

## Authentication

### Login

**Endpoint:** `POST /auth/{version}/login`

**Purpose:** Authenticate user and obtain access tokens

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "userPassword"
}
```

**Response:**

```json
{
  "status": "SUCCESS",
  "message": "Login successful",
  "result": {
    "accessToken": "eyJhbGciOiJSUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJSUzUxMiJ9...",
    "user": {
      "id": 45785789,
      "fullName": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "username": "johndoe",
      "displayUsername": true,
      "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
      "stats": {
        "singles": "4.125",
        "singlesVerified": "4.1",
        "singlesProvisional": false,
        "singlesReliabilityScore": 10,
        "doubles": "2.864",
        "doublesVerified": "2.75",
        "doublesProvisional": false,
        "doublesReliabilityScore": 10,
        "defaultRating": "DOUBLES"
      }
    }
  }
}
```

### Refresh Access Token

**Endpoint:** `GET /auth/{version}/refresh`

**Purpose:** Obtain new access and refresh tokens using a valid refresh token

**Headers:**

```
Content-Type: application/json
x-refresh-token: {refreshToken}
```

**Response:**

```json
{
  "status": "SUCCESS",
  "message": "Token refreshed successfully",
  "result": "eyJhbGciOiJSUzUxMiJ9..."
}
```

**Note:** The refresh endpoint returns only a new access token as a string in the `result` field. The refresh token remains the same and should be reused for subsequent refresh operations.

### Token Management

- Store `accessToken` in localStorage for authenticated requests
- Store `refreshToken` in localStorage for token refresh operations
- Include access token in Authorization header: `Bearer {accessToken}`
- Automatically refresh tokens when receiving 401 responses
- Both tokens are updated together during refresh operations

## User Profile

### Get User Profile

**Endpoint:** `GET /user/{version}/profile`

**Purpose:** Retrieve authenticated user's complete profile information

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "id": 45785789,
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "user@example.com",
    "phone": "+14445785789",
    "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
    "birthdate": "1990-01-15",
    "gender": "MALE",
    "hand": "RIGHT",
    "stats": {
      "singles": "4.125",
      "singlesVerified": "4.1",
      "singlesProvisional": false,
      "singlesReliabilityScore": 85,
      "doubles": "2.864",
      "doublesVerified": "2.75",
      "doublesProvisional": false,
      "doublesReliabilityScore": 92,
      "defaultRating": "DOUBLES"
    },
    "addresses": [
      {
        "formattedAddress": "Austin, TX, USA",
        "latitude": 30.2672,
        "longitude": -97.7431
      }
    ],
    "active": true,
    "restricted": false
  }
}
```

## Match History

### Get User Match History

**Endpoint:** `GET /match/{version}/history?offset={offset}&limit={limit}`

**Purpose:** Retrieve authenticated user's match history with pagination

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Query Parameters:**

- `offset` (required): Starting position for pagination (integer)
- `limit` (required): Number of matches to return (integer, max 25)

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "offset": 0,
    "limit": 10,
    "total": 45,
    "empty": false,
    "hasMore": true,
    "hasPrevious": false,
    "hits": [
      {
        "id": 7737603024,
        "matchId": 7737603024,
        "displayIdentity": "IS20MDL2",
        "venue": "Austin Pickleball Club",
        "location": "Austin, TX",
        "tournament": "Weekly League",
        "eventDate": "2024-01-15",
        "eventFormat": "DOUBLES",
        "confirmed": true,
        "teams": [
          {
            "id": 1,
            "serial": 1,
            "player1": {
              "id": 45785789,
              "fullName": "John Doe",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
              "rating": "4.125"
            },
            "player2": {
              "id": 87654321,
              "fullName": "Jane Smith",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile2.jpg",
              "rating": "3.950"
            },
            "game1": 11,
            "game2": 9,
            "game3": 11,
            "game4": -1,
            "game5": -1,
            "winner": true,
            "delta": "+0.025",
            "teamRating": "4.038"
          },
          {
            "id": 2,
            "serial": 2,
            "player1": {
              "id": 12345678,
              "fullName": "Bob Johnson",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile3.jpg",
              "rating": "4.200"
            },
            "player2": {
              "id": 98765432,
              "fullName": "Alice Brown",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile4.jpg",
              "rating": "3.875"
            },
            "game1": 9,
            "game2": 11,
            "game3": 9,
            "game4": -1,
            "game5": -1,
            "winner": false,
            "delta": "-0.025",
            "teamRating": "4.038"
          }
        ],
        "matchSource": "CLUB",
        "noOfGames": 3,
        "status": "COMPLETE",
        "created": "2024-01-15T14:30:00.000Z"
      }
    ]
  }
}
```

### Get Filtered Match History

**Endpoint:** `POST /match/{version}/history`

**Purpose:** Search match history with filters

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "offset": 0,
  "limit": 10,
  "filters": {
    "eventFormat": ["DOUBLES", "SINGLES"],
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "venue": "Austin Pickleball Club"
  }
}
```

## Player Search

## Record a Match

### Save Match

Following the extraction process, this endpoint allows recording a new match. It maps to `PUT /match/{version}/save` with body schema `MatchRequest`.

**Endpoint:** `PUT /match/v1.0/save`

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body (subset for minimal singles entry):**

```json
{
  "event": "Open DUPR match",
  "eventDate": "2025-08-10",
  "location": "",
  "matchType": "SIDE_ONLY",
  "format": "SINGLES",
  "notify": true,
  "scores": [{ "first": 11, "second": 9 }],
  "team1": {
    "player1": 8585842234,
    "player2": "",
    "game1": 11,
    "game2": -1,
    "game3": -1,
    "game4": -1,
    "game5": -1,
    "winner": true
  },
  "team2": {
    "player1": 7114776205,
    "player2": "",
    "game1": 9,
    "game2": -1,
    "game3": -1,
    "game4": -1,
    "game5": -1,
    "winner": false
  }
}
```

Notes:

- Required fields per schema: `eventDate`, `format`, `notify`, `scores`, `team1`, `team2`.
- `team.player2` may be sent as an empty string for singles.
- `scores` is an array of `{ first, second }` pairs; for a single game, provide one pair.
- `matchType` supports `SIDE_ONLY` or `RALLY`. Minimal flow uses `SIDE_ONLY`.

### Search Players

**Endpoint:** `POST /player/{version}/search`

**Purpose:** Search for other players by name or criteria

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "offset": 0,
  "limit": 10,
  "query": "John",
  "filters": {
    "gender": "MALE",
    "location": {
      "lat": 30.2672,
      "lng": -97.7431,
      "radiusInMeters": 50000
    },
    "ratingRange": {
      "min": 3.0,
      "max": 5.0
    }
  }
}
```

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "offset": 0,
    "limit": 10,
    "total": 25,
    "hits": [
      {
        "id": 45785789,
        "fullName": "John Doe",
        "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
        "location": "Austin, TX",
        "stats": {
          "singles": "4.125",
          "doubles": "3.950",
          "defaultRating": "DOUBLES"
        },
        "distance": "2.5 miles"
      }
    ]
  }
}
```

## Match History for Other Players

### Get Player Match History

**Endpoint:** `GET /player/{version}/{id}/history?offset={offset}&limit={limit}`

**Purpose:** Retrieve match history for any specific player (not just authenticated user)

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Query Parameters:**

- `offset` (required): Starting position for pagination (integer, format: int32)
- `limit` (required): Number of matches to return (integer, format: int32)

**Response:**

Returns `SingleWrapperPageMatchResponse` format:

```json
{
  "status": "SUCCESS",
  "message": "Show this message to user.",
  "result": {
    "offset": 0,
    "limit": 10,
    "total": 100,
    "empty": false,
    "hasMore": true,
    "hasPrevious": false,
    "totalValueRelation": "EQUAL_TO",
    "hits": [
      {
        "id": 7737603024,
        "matchId": 7737603024,
        "userId": 231312312312,
        "displayIdentity": "IS20MDL2",
        "venue": "Dreamland Pickleball",
        "location": "Newport Beach, CA",
        "matchScoreAdded": true,
        "tournament": "Newport Beach Doubles Shootout",
        "league": "Example League",
        "eventDate": "2024-01-15",
        "eventFormat": "DOUBLES",
        "confirmed": true,
        "teams": [
          {
            "id": 1,
            "serial": 1,
            "player1": {
              "id": 45785789,
              "fullName": "John Doe",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
              "rating": "4.125"
            },
            "player2": {
              "id": 87654321,
              "fullName": "Jane Smith",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile2.jpg",
              "rating": "3.950"
            },
            "game1": 11,
            "game2": 9,
            "game3": 11,
            "game4": -1,
            "game5": -1,
            "winner": true,
            "delta": "+0.025",
            "teamRating": "4.038"
          },
          {
            "id": 2,
            "serial": 2,
            "player1": {
              "id": 12345678,
              "fullName": "Bob Johnson",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile3.jpg",
              "rating": "4.200"
            },
            "player2": {
              "id": 98765432,
              "fullName": "Alice Brown",
              "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile4.jpg",
              "rating": "3.875"
            },
            "game1": 9,
            "game2": 11,
            "game3": 9,
            "game4": -1,
            "game5": -1,
            "winner": false,
            "delta": "-0.025",
            "teamRating": "4.038"
          }
        ],
        "created": "2020-03-04T17:21:16.000Z",
        "matchSource": "CLUB",
        "noOfGames": 3,
        "status": "COMPLETE",
        "matchType": "RALLY",
        "eloCalculated": true
      }
    ]
  }
}
```

### Get Filtered Player Match History

**Endpoint:** `POST /player/{version}/{id}/history`

**Purpose:** Search match history for a specific player with filters

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "offset": 0,
  "limit": 10,
  "filters": {
    "eventFormat": ["DOUBLES", "SINGLES"],
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "venue": "Dreamland Pickleball"
  }
}
```

**Response:** Same `SingleWrapperPageMatchResponse` format as GET version above.

## Rating History

### Get Player Rating History

**Endpoint:** `GET /player/{version}/{playerId}/rating-history?offset={offset}&limit={limit}`

**Purpose:** Get rating history for a specific player

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "offset": 0,
    "limit": 10,
    "total": 50,
    "hits": [
      {
        "ratingHistoryId": 123456,
        "userId": 45785789,
        "userName": "John Doe",
        "singles": 4.125,
        "singlesProvisional": false,
        "doubles": 3.95,
        "doublesProvisional": false,
        "matchDate": "2024-01-15",
        "created": "2024-01-15T14:30:00.000Z",
        "status": "COMPLETE"
      }
    ]
  }
}
```

## Common Response Patterns

### Standard Response Wrapper

All DUPR API responses follow this pattern:

```json
{
  "status": "SUCCESS|FAILURE|REDIRECT|PARTIAL",
  "message": "Optional message for user",
  "result": {
    /* Actual response data */
  }
}
```

### Pagination Pattern

Paginated responses include:

```json
{
  "offset": 0, // Starting position
  "limit": 10, // Items per page
  "total": 45, // Total available items
  "empty": false, // Are results empty
  "hasMore": true, // More results available
  "hasPrevious": false, // Previous page available
  "hits": [] // Array of results
}
```

## Error Handling

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Response Format

```json
{
  "status": "FAILURE",
  "message": "Error description for user",
  "errors": [
    {
      "code": "INVALID_CREDENTIALS",
      "message": "Email or password is incorrect"
    }
  ]
}
```

## Implementation Notes

### API Versioning

- Use `v1` as the version parameter for all endpoints
- Example: `/auth/v1/login`, `/user/v1/profile`

### Rate Limiting

- API has rate limits (specific limits not documented in Swagger)
- Implement retry logic with exponential backoff
- Monitor 429 responses and implement appropriate delays

### Data Types

- **Ratings**: Returned as strings (e.g., "4.125") but represent decimal numbers
- **Dates**: Use ISO format YYYY-MM-DD
- **Timestamps**: ISO 8601 format with timezone
- **IDs**: 64-bit integers

### Security Considerations

- Always use HTTPS
- Store tokens securely in localStorage
- Implement token refresh logic
- Never log sensitive data (passwords, tokens)
- Validate all user inputs on frontend

## MVP Implementation Priority

### Phase 1 (Essential)

1. **Authentication** - `/auth/v1/login`
2. **User Profile** - `/user/v1/profile`
3. **Match History** - `/match/v1/history`

### Phase 2 (Enhanced)

1. **Player Search** - `/player/v1/search`
2. **Rating History** - `/player/v1/{id}/rating-history`
3. **Filtered Match History** - `/match/v1/history` (POST)

## Social Features (Follow/Followers)

### Follow a User

**Endpoint:** `POST /activity/{version}/user/{feedId}/follow`

**Purpose:** Follow another user

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "message": "Follow successful"
}
```

### Unfollow a User

**Endpoint:** `DELETE /activity/{version}/user/{feedId}/follow`

**Purpose:** Unfollow a user

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "message": "Unfollow successful"
}
```

### Get User's Followers

**Endpoint:** `GET /activity/{version}/user/{feedId}/followers?offset={offset}&limit={limit}`

**Purpose:** Get list of users who follow the specified user

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "results": [
    {
      "id": 45785789,
      "name": "John Doe",
      "profileImage": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
      "isFollow": true
    }
  ]
}
```

### Get User's Following List

**Endpoint:** `GET /activity/{version}/user/{feedId}/followings?offset={offset}&limit={limit}`

**Purpose:** Get list of users that the specified user follows

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "results": [
    {
      "id": 87654321,
      "name": "Jane Smith",
      "profileImage": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile2.jpg",
      "isFollow": true
    }
  ]
}
```

### Get Following Info

**Endpoint:** `GET /activity/{version}/user/{feedId}/followingInfo`

**Purpose:** Get follow counts and follow status for a user

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "isFollowed": true,
    "followers": 25,
    "followings": 18
  }
}
```

## Updated Player Search

### Search Players (Corrected Format)

**Endpoint:** `POST /player/{version}/search`

**Purpose:** Search for other players by name or criteria

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "offset": 0,
  "limit": 10,
  "query": "John",
  "filter": {
    "gender": "MALE",
    "lat": 30.2672,
    "lng": -97.7431,
    "radiusInMeters": 50000,
    "rating": {
      "min": 3.0,
      "max": 5.0
    }
  },
  "includeUnclaimedPlayers": false
}
```

**Note:** `filter` (not `filters`), `lat`/`lng`/`radiusInMeters` are required in filter, and `includeUnclaimedPlayers` is required.

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "offset": 0,
    "limit": 25,
    "total": 29,
    "hits": [
      {
        "id": 4888436907,
        "fullName": "Aamir B",
        "firstName": "Aamir",
        "lastName": "B",
        "shortAddress": "Villanova, PA, US",
        "gender": "MALE",
        "age": 39,
        "hand": "RIGHT",
        "imageUrl": "https://dupr.s3.us-east-1.amazonaws.com/images/image_cropper_19BB0D70-DB98-4CFC-855F-2E8216AC9063-9977-000007C819DEA481.jpg",
        "ratings": {
          "singles": "NR",
          "singlesVerified": "NR",
          "singlesProvisional": false,
          "singlesReliabilityScore": 0,
          "doubles": "4.192",
          "doublesVerified": "NR",
          "doublesProvisional": true,
          "doublesReliabilityScore": 1,
          "defaultRating": "DOUBLES",
          "provisionalRatings": {
            "singlesRating": null,
            "doublesRating": null,
            "coach": null
          }
        },
        "distance": "83.4 mi",
        "enablePrivacy": false,
        "distanceInMiles": 83.4,
        "isPlayer1": true,
        "verifiedEmail": true,
        "registered": true,
        "duprId": "8WW4NY",
        "showRatingBanner": false,
        "status": "ACTIVE",
        "sponsor": {},
        "lucraConnected": false
      }
    ]
  }
}
```

**Key Response Fields:**

- `hits[]` - Array of search results
- `hits[].ratings` - Player ratings object containing:
  - `singles` - Singles rating (string, may be "NR" for not rated)
  - `singlesVerified` - Verified singles rating
  - `singlesProvisional` - Boolean indicating if singles rating is provisional
  - `doubles` - Doubles rating (string, may be "NR" for not rated)
  - `doublesVerified` - Verified doubles rating
  - `doublesProvisional` - Boolean indicating if doubles rating is provisional
  - `defaultRating` - Either "SINGLES" or "DOUBLES"

## Player Profile Data

### Get Player Statistics

**Endpoint:** `GET /user/calculated/{version}/stats/{id}`

**Purpose:** Get calculated statistics for a specific player

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "singles": {
      "averagePartnerDupr": 6.391,
      "averageOpponentDupr": 3.254,
      "averagePointsWonPercent": 0.67,
      "halfLife": 3.0
    },
    "doubles": {
      "averagePartnerDupr": 5.921,
      "averageOpponentDupr": 4.124,
      "averagePointsWonPercent": 0.64,
      "halfLife": 2.8
    },
    "resulOverview": {
      "totalMatches": 45,
      "wins": 32,
      "losses": 13
    }
  }
}
```

### Get Player Rating History (Advanced)

**Endpoint:** `POST /player/{version}/{id}/rating-history`

**Purpose:** Get detailed rating history for a specific player

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "type": "DOUBLES",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "limit": 50,
  "offset": 0,
  "sortBy": "desc"
}
```

**Note:** Only `type` is required. This endpoint uses POST method and requires a request body.

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "ratingHistory": [
      {
        "date": "2024-01-15",
        "rating": 4.125,
        "verified": true,
        "provisional": false
      }
    ]
  }
}
```

## Other User Profile Data

### Get User Calculated Statistics

**Endpoint:** `GET /user/calculated/{version}/stats/{id}`

**Purpose:** Get calculated statistics for any specific user (not just authenticated user)

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "singles": {
      "averagePartnerDupr": 6.391,
      "averageOpponentDupr": 3.254,
      "averagePointsWonPercent": 0.67,
      "halfLife": 3.0
    },
    "doubles": {
      "averagePartnerDupr": 5.921,
      "averageOpponentDupr": 4.124,
      "averagePointsWonPercent": 0.64,
      "halfLife": 2.8
    },
    "resulOverview": {
      "wins": 32,
      "losses": 13,
      "pending": 0
    }
  }
}
```

### Get Other User's Following Info

**Endpoint:** `GET /activity/{version}/user/{feedId}/followingInfo`

**Purpose:** Get follow counts and follow status for any user

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "SUCCESS",
  "result": {
    "isFollowed": true,
    "followers": 25,
    "followings": 18
  }
}
```

### Get Other User's Match History

**Endpoint:** `GET /player/{version}/{id}/history?offset={offset}&limit={limit}`

**Purpose:** Retrieve match history for any specific user (already documented above)

### Get Other User's Rating History

**Endpoint:** `POST /player/{version}/{id}/rating-history`

**Purpose:** Get detailed rating history for any specific user (already documented above)

## Navigation Between User Profiles

When implementing other user profiles, you'll need these four endpoints:

1. **Match History**: `/player/v1.0/{id}/history` - User's matches
2. **Statistics**: `/user/calculated/v1.0/stats/{id}` - Advanced stats
3. **Rating History**: `/player/v1.0/{id}/rating-history` - Rating progression
4. **Follow Info**: `/activity/v1.1/user/{id}/followingInfo` - Social stats

These endpoints allow full profile viewing for any user in the system, enabling navigation from followers/following lists to complete user profiles.

## Match Validation

### Confirm Match

**Endpoint:** `POST /match/v1.0/confirm`

**Purpose:** Confirm/validate a match result

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "matchId": 5942049729
}
```

**Response:**

```json
{
  "status": "SUCCESS",
  "message": "Match confirmed successfully"
}
```

### Reject Match

**Endpoint:** `DELETE /match/v1.0/delete/{matchId}`

**Purpose:** Reject/delete a match result

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Path Parameters:**

- `matchId` (number): The ID of the match to reject

**Response:**

```json
{
  "status": "SUCCESS",
  "message": "Match deleted successfully"
}
```

## Feed

### Get User Activity Feed

**Endpoint:** `GET /activity/{version}/user/{feedId}`

**Purpose:** Retrieve activity feed for a user, showing matches and posts from followed users

**Parameters:**

- `version` (path, required): API version (e.g., "v1.1")
- `feedId` (path, required): User's feed ID (typically the user's DUPR ID)
- `limit` (query, optional): Maximum number of feed items to return (default: 10)
- `ref` (query, optional): Reference point for pagination

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response:**

```json
{
  "status": "SUCCESS",
  "message": "Feed retrieved successfully",
  "results": [
    {
      "id": "post_12345",
      "activityId": "activity_12345",
      "actor": {
        "id": 5285541901,
        "name": "John Doe",
        "profileImage": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
        "isFollow": true
      },
      "verb": "MATCH",
      "content": "Match completed",
      "reactionCounts": {
        "like": 5,
        "comment": 2
      },
      "ownReactions": {
        "like": []
      },
      "tags": [],
      "hashtags": [],
      "images": [],
      "matches": [
        {
          "id": 123456,
          "userId": 5285541901,
          "venue": "Local Court",
          "location": "New York, NY",
          "matchScoreAdded": true,
          "tournament": null,
          "league": null,
          "eventDate": "2024-09-15",
          "eventFormat": "SINGLES",
          "scoreFormat": {
            "id": 1,
            "format": "Best of 3",
            "variant": "Standard",
            "priority": 1,
            "games": 3,
            "winningScore": 11
          },
          "confirmed": true,
          "confirmationThreshold": 2,
          "teams": [
            {
              "player1": {
                "id": 5285541901,
                "fullName": "John Doe",
                "imageUrl": "https://dupr-dev.s3.us-east-1.amazonaws.com/users/profile.jpg",
                "validatedMatch": true
              },
              "player2": null,
              "game1": 11,
              "game2": 9,
              "game3": null,
              "winner": true
            },
            {
              "player1": {
                "id": 987654,
                "fullName": "Jane Smith",
                "imageUrl": null,
                "validatedMatch": true
              },
              "player2": null,
              "game1": 9,
              "game2": 11,
              "game3": null,
              "winner": false
            }
          ],
          "status": "COMPLETE",
          "modified": "2024-09-15T14:30:00Z"
        }
      ],
      "location": {},
      "createdAt": 1726405800000,
      "updatedAt": 1726405800000
    }
  ]
}
```

**Notes:**

- The `matches` array contains the actual match data that can be displayed in the feed
- Each post may contain multiple matches
- The `actor` field contains information about the user who posted the activity
- Use the `limit` parameter to control pagination (default is 10)
- The response is an array of `PostResponse` objects wrapped in a standard response format
- The `verb` field indicates the type of activity: `"MATCH"` for match-related posts, `"POST"` for general posts
- For match feeds, filter posts where `verb === "MATCH"` to exclude general posts
- The response uses `results` (plural) as the key for the posts array

This API guide provides all the information needed to implement the core functionality of Open DUPR as outlined in your implementation plan.
