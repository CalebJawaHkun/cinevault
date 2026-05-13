# Express Backend API

Simple Express.js backend setup with MongoDB, Clerk authentication, Cloudinary media storage, and Inngest background jobs.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Clerk Auth
- Cloudinary
- Axios
- Inngest

---

## Dependencies

```json
"dependencies": {
  "@clerk/express": "^2.1.15",
  "axios": "^1.16.0",
  "cloudinary": "^2.10.0",
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "inngest": "^4.4.0",
  "mongoose": "^9.6.2"
}
```

---

## Installation

```bash
npm install
```

---

## Run Server

```bash
npm run server
```

---

## Written By

### Caleb Jawa Hkun

## Version 2.0.0

### Major Changes

1. Added all endpoints and services, which are documented as below.

# Mongoose Database Models Documentation

## Overview

The application uses MongoDB with Mongoose ODM to manage and structure data for the movie ticket booking system. The core collections are:

- User
- Movie
- Show
- Booking

These models are interconnected to support movie scheduling, seat reservations, payment tracking, and user bookings.

---

# 1. Booking Model

## Description

The Booking model stores ticket reservation information created by users for specific movie shows. It also tracks payment status and reserved seats.

## Schema Definition

| Field | Type | Required | Default | Reference | Description |
|---|---|---|---|---|---|
| user | String | Yes | - | User | Stores the ID of the user who created the booking |
| show | String | Yes | - | Show | Stores the ID of the selected show |
| amount | Number | Yes | - | - | Total booking/payment amount |
| bookedSeats | Array | Yes | - | - | Array containing reserved seat identifiers |
| isPaid | Boolean | No | false | - | Indicates whether payment has been completed |
| paymentLink | String | No | - | - | External payment URL/link |
| createdAt | Date | Auto | - | - | Automatically generated booking creation timestamp |
| updatedAt | Date | Auto | - | - | Automatically generated update timestamp |

## Features

- Tracks payment completion status.
- Maintains booked seat information.
- Links bookings to both users and shows.
- Uses automatic timestamps for auditing and tracking.

## Example Document

```json
{
  "_id": "664bc7a6e5d12a0012ab1234",
  "user": "user_123",
  "show": "show_456",
  "amount": 25,
  "bookedSeats": ["A1", "A2"],
  "isPaid": true,
  "paymentLink": "https://payment-provider.com/pay/xyz",
  "createdAt": "2026-05-13T08:30:00.000Z",
  "updatedAt": "2026-05-13T08:35:00.000Z"
}
```

---

# 2. Movie Model

## Description

The Movie model stores detailed movie information retrieved from external movie services or manually inserted into the database.

## Schema Definition

| Field | Type | Required | Description |
|---|---|---|---|
| _id | String | Yes | Unique movie identifier |
| title | String | Yes | Movie title |
| overview | String | Yes | Movie description/synopsis |
| poster_path | String | Yes | URL/path to movie poster image |
| backdrop_path | String | Yes | URL/path to movie backdrop image |
| release_date | String | Yes | Official movie release date |
| original_language | String | No | Original language of the movie |
| tagline | String | No | Promotional movie tagline |
| genres | Array | Yes | List of movie genres |
| casts | Array | Yes | List of cast members |
| vote_average | Number | Yes | Average movie rating |
| runtime | Number | Yes | Movie duration in minutes |
| createdAt | Date | Auto | Automatically generated creation timestamp |
| updatedAt | Date | Auto | Automatically generated update timestamp |

## Features

- Stores complete movie metadata.
- Supports genre and cast categorization.
- Contains media assets such as posters and backdrops.
- Includes movie ratings and runtime information.

## Example Document

```json
{
  "_id": "movie_101",
  "title": "Interstellar",
  "overview": "A team of explorers travel through a wormhole in space.",
  "poster_path": "/poster/interstellar.jpg",
  "backdrop_path": "/backdrop/interstellar.jpg",
  "release_date": "2014-11-07",
  "original_language": "en",
  "tagline": "Mankind was born on Earth. It was never meant to die here.",
  "genres": ["Science Fiction", "Adventure"],
  "casts": ["Matthew McConaughey", "Anne Hathaway"],
  "vote_average": 8.7,
  "runtime": 169
}
```

---

# 3. Show Model

## Description

The Show model represents a scheduled screening of a movie. It contains show timing, pricing, and seat occupancy information.

## Schema Definition

| Field | Type | Required | Default | Reference | Description |
|---|---|---|---|---|---|
| movie | String | Yes | - | Movie | Stores the related movie ID |
| showDateTime | Date | Yes | - | - | Date and time of the movie screening |
| showPrice | Number | Yes | - | - | Ticket price for the show |
| occupiedSeats | Object | No | {} | - | Stores reserved seat information |

## Features

- Links movie screenings to movies.
- Tracks occupied/reserved seats.
- Supports dynamic pricing per show.
- Uses a flexible object structure for seat management.

## Example Document

```json
{
  "_id": "show_456",
  "movie": "movie_101",
  "showDateTime": "2026-05-20T18:00:00.000Z",
  "showPrice": 12,
  "occupiedSeats": {
    "A1": "user_123",
    "A2": "user_123"
  }
}
```

---

# 4. User Model

## Description

The User model stores authenticated user account information.

## Schema Definition

| Field | Type | Required | Description |
|---|---|---|---|
| _id | String | Yes | Unique user identifier |
| name | String | Yes | Full name of the user |
| email | String | Yes | User email address |
| image | String | Yes | Profile image URL |

## Features

- Stores user profile information.
- Supports external authentication providers.
- Uses string-based IDs for compatibility with third-party authentication systems.

## Example Document

```json
{
  "_id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "image": "https://example.com/profile.jpg"
}
```

---

# Model Relationships

## Entity Relationships

| Model | Related Model | Relationship |
|---|---|---|
| Booking | User | Many bookings belong to one user |
| Booking | Show | Many bookings belong to one show |
| Show | Movie | Many shows belong to one movie |

## Relationship Flow

1. A User creates a Booking.
2. The Booking references a specific Show.
3. The Show references a Movie.
4. The Booking stores selected seats and payment status.

---

# Design Notes

## String-Based References

The application uses String IDs instead of MongoDB ObjectIds for compatibility with external systems and APIs.

## Timestamp Usage

Models using `timestamps: true` automatically generate:

- `createdAt`
- `updatedAt`

These fields help track record creation and modification times.

## Seat Management

The `occupiedSeats` object in the Show model allows flexible seat tracking by dynamically storing seat identifiers and ownership information.

## Payment Tracking

The Booking model separates booking creation from payment completion using the `isPaid` field, allowing pending and completed bookings to be managed independently.

# Show Routes API Documentation

## Overview

Base Endpoint:

```text
/api/show
```

Architecture:

```text
Controller -> Router -> server.js
```

---

# Route Summary

| Method | Endpoint | Auth | Controller | Request | Description |
|---|---|---|---|---|---|
| GET | /now-playing | Admin | getNowPlayingMovies | - | Fetch now playing movies from TMDB |
| POST | /add | Admin | addShow | { movieId, showPrice, showsInput } | Create movie shows (auto-fetch movie if missing) |
| GET | /all | Public | getShows | - | Get upcoming shows grouped by movies |
| GET | /:movieId | Public | getShow | movieId param | Get show schedule for a movie |

---

# Implementation Notes

## Authentication
- Admin-only: `/now-playing`, `/add`
- Public: `/all`, `/:movieId`
- Middleware: `protectAdmin`

---

## 1. Now Playing Movies

- Calls TMDB `/movie/now_playing`
- Returns live movie list

---

## 2. Add Show

- Checks Movie in DB
- If missing → fetch TMDB details + credits → create Movie
- Builds shows from `showsInput`
- Inserts via `Show.insertMany()`

---

## 3. Get All Shows

- Query: future shows only (`showDateTime >= now`)
- Populates `movie`
- Sorts by time
- Deduplicates by movie

---

## 4. Get Show (by movie)

- Fetches future shows for movieId
- Groups results by date
- Returns structured schedule `{ date: [ {time, showId} ] }`

---

## External API

- TMDB used for:
  - now-playing
  - movie details
  - movie credits

---

## Error Handling

Standard across all endpoints:

- try/catch
- console.error logging
- JSON response

```json
{
  "success": false,
  "message": "Error message"
}
```
# User Routes API Documentation

## Overview

Base Endpoint:

```text
/api/user
```

Architecture:

```text
Controller -> Router -> server.js
```

---

# Route Summary

| Method | Endpoint | Auth | Controller | Request | Description |
|---|---|---|---|---|---|
| GET | /bookings | User | getUserBookings | - | Fetch user bookings with show + movie data |
| POST | /update-favorite | User | updateFavorite | { movieId } | Toggle favorite movie in Clerk metadata |
| GET | /favorites | User | getFavorites | - | Fetch favorite movies from DB |

---

# Implementation Notes

## Authentication
All routes rely on Clerk auth:

```js
req.auth().userId
```

---

## 1. Bookings Flow

- Query: `Booking.find({ user })`
- Populates: `show → movie`
- Sort: newest first

Response:

```json
{
  "success": true,
  "bookings": []
}
```

---

## 2. Favorite Toggle Flow

- Reads Clerk `privateMetadata.favorites`
- If exists → remove
- If not → add
- Updates Clerk user metadata

External SDK:
- `clerkClient.users.getUser()`
- `clerkClient.users.updateUserMetadata()`

Response:

```json
{
  "success": true,
  "message": "Favorite movies updated"
}
```

---

## 3. Favorites Fetch Flow

- Reads favorite IDs from Clerk
- Queries MongoDB:

```js
Movie.find({ _id: { $in: favorites } })
```

Response:

```json
{
  "success": true,
  "movies": []
}
```

---

## Error Handling

Standard across all routes:

- try/catch blocks
- console.error logging
- JSON error response

```json
{
  "success": false,
  "message": "Error message"
}
```
# Booking Routes API Documentation

## Overview

Base Endpoint:

```text
/api/booking
```

Architecture:

```text
Controller -> Router -> server.js
```

---

# Route Summary

| Method | Endpoint | Auth | Controller | Request | Description |
|---|---|---|---|---|---|
| POST | /create | User | createBooking | { showId, selectedSeats } | Create booking + reserve seats |
| GET | /seats/:showId | Public | getOccupiedSeats | showId param | Get occupied seats for a show |

---

# Implementation Notes

## Authentication
- User-only routes use Clerk auth:
```js
req.auth().userId
```

---

## 1. Create Booking

### Flow

- Extract `userId`, `showId`, `selectedSeats`
- Check seat availability
- Create booking record
- Update `occupiedSeats` in Show

### Seat Availability Check

- Fetch show
- Ensure no selected seat already exists in `occupiedSeats`

### DB Operations

- `Show.findById()`
- `Booking.create()`
- `showData.save()`

### Seat Allocation

```js
showData.occupiedSeats[seat] = userId
```

### Response

```json
{
  "success": true,
  "message": "Booked Successfully"
}
```

---

## 2. Get Occupied Seats

### Flow

- Fetch show by `showId`
- Extract keys from `occupiedSeats`

### Logic

```js
Object.keys(showData.occupiedSeats)
```

### Response

```json
{
  "success": true,
  "occupiedSeats": []
}
```

---

# Data Model Interaction

- Booking → stores user, show, seats, amount
- Show → tracks seat occupancy via object map

---

# Error Handling

Standard across all routes:

- try/catch blocks
- console.error logging
- JSON error response

```json
{
  "success": false,
  "message": "Error message"
}
```
# Admin Routes API Documentation

## Overview

Base Endpoint:

```text
/api/admin
```

Architecture:

```text
Controller -> Router -> server.js
```

---

# Route Summary

| Method | Endpoint | Auth | Controller | Request | Description |
|---|---|---|---|---|---|
| GET | /is-admin | Admin | isAdmin | - | Verify admin access |
| GET | /dashboard | Admin | getDashboardData | - | Fetch dashboard analytics |
| GET | /all-shows | Admin | getAllShows | - | Fetch all upcoming shows |
| GET | /all-bookings | Admin | getAllBookings | - | Fetch all bookings with relations |

---

# Implementation Notes

## Authentication
All routes protected by:
```js
protectAdmin
```

---

## 1. Admin Check

Returns static confirmation that user is admin.

```json
{
  "success": true,
  "isAdmin": true
}
```

---

## 2. Dashboard Data

### Flow

- Paid bookings only
- Active future shows
- Total user count

### Aggregations

- Revenue = sum of booking amounts
- Bookings = count of paid bookings

### DB Operations

- `Booking.find({ isPaid: true })`
- `Show.find({ showDateTime >= now })`
- `User.countDocuments()`

### Response

```json
{
  "success": true,
  "dashboardData": {
    "totalBookings": 0,
    "totalRevenue": 0,
    "activeShows": [],
    "totalUser": 0
  }
}
```

---

## 3. Get All Shows

- Fetches future shows only
- Populates movie data
- Sorted by time ascending

---

## 4. Get All Bookings

### Flow

- Fetch all bookings
- Populate:
  - user
  - show → movie
- Sort by newest first

### DB Query

```js
Booking.find({}).populate('user')
```

### Response

```json
{
  "success": true,
  "bookings": []
}
```

---

# Error Handling

Standard across all endpoints:

- try/catch blocks
- console.error logging
- JSON error response

```json
{
  "success": false,
  "message": "Error message"
}
```



