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

### Token Management

- Store `accessToken` in localStorage for authenticated requests
- Use `refreshToken` to obtain new access tokens when needed
- Include access token in Authorization header: `Bearer {accessToken}`

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

This API guide provides all the information needed to implement the core functionality of Open DUPR as outlined in your implementation plan.
