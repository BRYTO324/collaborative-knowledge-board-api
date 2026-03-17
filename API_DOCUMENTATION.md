# Collaborative Knowledge Board — API Documentation

**Version:** 2.0.0 | **Base URL:** `http://localhost:3000/api` | **Protocol:** REST + WebSocket

---

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Boards](#boards)
4. [Columns](#columns)
5. [Cards](#cards)
6. [Tags](#tags)
7. [Comments](#comments)
8. [Real-Time WebSocket](#real-time-websocket)
9. [Error Reference](#error-reference)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

All endpoints except `POST /auth/register` and `POST /auth/login` require a valid JWT token.

```
Authorization: Bearer <your_jwt_token>
```

Tokens are issued on login and expire after 7 days.

---

## Response Format

Every response — success or error — follows this envelope:

```json
{
  "success": true,
  "message": "Human-readable description",
  "data": {}
}
```

---

## Authentication

### Register

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Boards

### Create Board

```http
POST /api/boards
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My Project Board",
  "description": "Project management board"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Board created successfully",
  "data": {
    "id": "b1c2d3e4-...",
    "title": "My Project Board",
    "description": "Project management board",
    "userId": "a1b2c3d4-...",
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T10:00:00.000Z"
  }
}
```

---

### Get All Boards (Paginated)

```http
GET /api/boards?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |

**Response `200`:**
```json
{
  "success": true,
  "message": "Boards retrieved successfully",
  "data": {
    "boards": [
      {
        "id": "b1c2d3e4-...",
        "title": "My Project Board",
        "description": "Project management board",
        "userId": "a1b2c3d4-...",
        "columns": [
          { "id": "c1d2e3f4-...", "title": "To Do", "position": 0, "boardId": "b1c2d3e4-..." }
        ],
        "createdAt": "2026-03-16T10:00:00.000Z",
        "updatedAt": "2026-03-16T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### Get Board by ID

```http
GET /api/boards/:id
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Board retrieved successfully",
  "data": {
    "id": "b1c2d3e4-...",
    "title": "My Project Board",
    "description": "Project management board",
    "userId": "a1b2c3d4-...",
    "columns": [
      { "id": "c1d2e3f4-...", "title": "To Do", "position": 0, "boardId": "b1c2d3e4-..." },
      { "id": "c2d3e4f5-...", "title": "In Progress", "position": 1, "boardId": "b1c2d3e4-..." }
    ],
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T10:00:00.000Z"
  }
}
```

---

### Update Board

```http
PATCH /api/boards/:id
Authorization: Bearer <token>
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated Board Title",
  "description": "Updated description"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Board updated successfully",
  "data": {
    "id": "b1c2d3e4-...",
    "title": "Updated Board Title",
    "description": "Updated description",
    "userId": "a1b2c3d4-...",
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T11:00:00.000Z"
  }
}
```

---

### Delete Board

```http
DELETE /api/boards/:id
Authorization: Bearer <token>
```

Cascades — deletes all columns, cards, and comments belonging to this board.

**Response `200`:**
```json
{
  "success": true,
  "message": "Board deleted successfully",
  "data": null
}
```

---

## Columns

### Create Column

```http
POST /api/columns
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "To Do",
  "boardId": "b1c2d3e4-...",
  "position": 0
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Column created successfully",
  "data": {
    "id": "c1d2e3f4-...",
    "title": "To Do",
    "position": 0,
    "boardId": "b1c2d3e4-...",
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T10:00:00.000Z"
  }
}
```

---

### Get Columns by Board

```http
GET /api/columns/board/:boardId
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Columns retrieved successfully",
  "data": [
    { "id": "c1d2e3f4-...", "title": "To Do", "position": 0, "boardId": "b1c2d3e4-..." },
    { "id": "c2d3e4f5-...", "title": "In Progress", "position": 1, "boardId": "b1c2d3e4-..." },
    { "id": "c3d4e5f6-...", "title": "Done", "position": 2, "boardId": "b1c2d3e4-..." }
  ]
}
```

---

### Update Column

```http
PATCH /api/columns/:id
Authorization: Bearer <token>
```

**Request Body** (all fields optional):
```json
{
  "title": "In Progress",
  "position": 1
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Column updated successfully",
  "data": {
    "id": "c1d2e3f4-...",
    "title": "In Progress",
    "position": 1,
    "boardId": "b1c2d3e4-...",
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T11:00:00.000Z"
  }
}
```

---

### Delete Column

```http
DELETE /api/columns/:id
Authorization: Bearer <token>
```

Cascades — deletes all cards and comments in this column.

**Response `200`:**
```json
{
  "success": true,
  "message": "Column deleted successfully",
  "data": null
}
```

---

## Cards

### Create Card

```http
POST /api/cards
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based authentication",
  "columnId": "c1d2e3f4-...",
  "dueDate": "2026-03-20T00:00:00.000Z"
}
```

> `position` is optional. If omitted, the card is appended to the end of the column.

**Response `201`:**
```json
{
  "success": true,
  "message": "Card created successfully",
  "data": {
    "id": "d1e2f3g4-...",
    "title": "Implement authentication",
    "description": "Add JWT-based authentication",
    "dueDate": "2026-03-20T00:00:00.000Z",
    "position": 0,
    "version": 1,
    "columnId": "c1d2e3f4-...",
    "tags": [],
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T10:00:00.000Z"
  }
}
```

> **WebSocket:** Emits `card:created` to all clients in the board room.

---

### Get Cards by Column (Paginated)

```http
GET /api/cards/column/:columnId?page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page (max 100) |

**Response `200`:**
```json
{
  "success": true,
  "message": "Cards retrieved successfully",
  "data": {
    "cards": [
      {
        "id": "d1e2f3g4-...",
        "title": "Implement authentication",
        "description": "Add JWT-based authentication",
        "dueDate": "2026-03-20T00:00:00.000Z",
        "position": 0,
        "version": 1,
        "columnId": "c1d2e3f4-...",
        "tags": [
          { "tag": { "id": "t1u2v3w4-...", "name": "urgent", "color": "#FF0000" } }
        ],
        "createdAt": "2026-03-16T10:00:00.000Z",
        "updatedAt": "2026-03-16T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

---

### Update Card

```http
PATCH /api/cards/:id
Authorization: Bearer <token>
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "dueDate": "2026-03-25T00:00:00.000Z",
  "version": 1
}
```

**Optimistic Locking:** Including `version` enables conflict detection. If the card has been modified by another user since you last fetched it, the server returns `409 Conflict`. Omit `version` to skip the check.

**Response `200`:**
```json
{
  "success": true,
  "message": "Card updated successfully",
  "data": {
    "id": "d1e2f3g4-...",
    "title": "Updated title",
    "description": "Updated description",
    "position": 0,
    "version": 2,
    "columnId": "c1d2e3f4-...",
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T11:00:00.000Z"
  }
}
```

**Conflict Response `409`:**
```json
{
  "success": false,
  "message": "Card has been modified by another user. Please refresh and try again."
}
```

> **WebSocket:** Emits `card:updated` to all clients in the board room.

---

### Move Card

```http
POST /api/cards/:id/move
Authorization: Bearer <token>
```

Moves a card to a target column and position. Handles both within-column reordering and cross-column moves. All position adjustments are executed in a single atomic database transaction — no duplicate positions, no data corruption.

**Request Body:**
```json
{
  "targetColumnId": "c2d3e4f5-...",
  "targetPosition": 2
}
```

> Set `targetColumnId` to the card's current column to reorder within the same column.

**Response `200`:**
```json
{
  "success": true,
  "message": "Card moved successfully",
  "data": {
    "id": "d1e2f3g4-...",
    "title": "Implement authentication",
    "position": 2,
    "version": 2,
    "columnId": "c2d3e4f5-...",
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T11:30:00.000Z"
  }
}
```

**Ordering Strategy:**
- Within-column: cards between the old and new position shift by ±1 to close/open the gap.
- Cross-column: source column gap is closed, target column space is opened, card is moved — three steps in one transaction.

> **WebSocket:** Emits `card:moved` to all clients in the board room.

---

### Delete Card

```http
DELETE /api/cards/:id
Authorization: Bearer <token>
```

Cascades — deletes all comments on this card.

**Response `200`:**
```json
{
  "success": true,
  "message": "Card deleted successfully",
  "data": null
}
```

> **WebSocket:** Emits `card:deleted` to all clients in the board room.

---

### Assign Tags to Card

```http
POST /api/cards/:id/tags
Authorization: Bearer <token>
```

Replaces the card's current tag assignments with the provided list. Send an empty array to remove all tags.

**Request Body:**
```json
{
  "tagIds": ["t1u2v3w4-...", "t2u3v4w5-..."]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Tags assigned successfully",
  "data": {
    "id": "d1e2f3g4-...",
    "title": "Implement authentication",
    "position": 0,
    "version": 1,
    "columnId": "c1d2e3f4-...",
    "tags": [
      { "tag": { "id": "t1u2v3w4-...", "name": "urgent", "color": "#FF0000" } },
      { "tag": { "id": "t2u3v4w5-...", "name": "backend", "color": "#3B82F6" } }
    ]
  }
}
```

---

## Tags

### Create Tag

```http
POST /api/tags
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "urgent",
  "color": "#FF0000"
}
```

> `color` is optional. Defaults to `#3B82F6` if omitted.

**Response `201`:**
```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "id": "t1u2v3w4-...",
    "name": "urgent",
    "color": "#FF0000",
    "createdAt": "2026-03-16T10:00:00.000Z"
  }
}
```

---

### Get All Tags

```http
GET /api/tags
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": [
    { "id": "t1u2v3w4-...", "name": "urgent", "color": "#FF0000", "createdAt": "2026-03-16T10:00:00.000Z" },
    { "id": "t2u3v4w5-...", "name": "backend", "color": "#3B82F6", "createdAt": "2026-03-16T10:00:00.000Z" }
  ]
}
```

---

## Comments

Comments support two levels of threading. Top-level comments have `parentId: null`. Replies reference a parent comment via `parentId`. Replying to a reply is rejected with `403`.

### Create Comment

```http
POST /api/comments
Authorization: Bearer <token>
```

**Top-level comment:**
```json
{
  "cardId": "d1e2f3g4-...",
  "content": "This looks great!"
}
```

**Threaded reply:**
```json
{
  "cardId": "d1e2f3g4-...",
  "content": "Agreed, well done!",
  "parentId": "e1f2g3h4-..."
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "e1f2g3h4-...",
    "content": "This looks great!",
    "cardId": "d1e2f3g4-...",
    "userId": "a1b2c3d4-...",
    "parentId": null,
    "user": {
      "id": "a1b2c3d4-...",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T10:00:00.000Z"
  }
}
```

**Nesting rules:**
- `parentId` omitted or `null` → top-level comment
- `parentId: <uuid>` → reply to a top-level comment
- `parentId` pointing to a reply → `403 Forbidden` (max 2 levels)

> **WebSocket:** Emits `comment:created` to all clients in the board room.

---

### Get Comments by Card

```http
GET /api/comments/card/:cardId
Authorization: Bearer <token>
```

Returns only top-level comments. Each includes a `replies` array with all direct replies.

**Response `200`:**
```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": "e1f2g3h4-...",
      "content": "This looks great!",
      "cardId": "d1e2f3g4-...",
      "userId": "a1b2c3d4-...",
      "parentId": null,
      "user": { "id": "a1b2c3d4-...", "name": "John Doe", "email": "user@example.com" },
      "replies": [
        {
          "id": "f1g2h3i4-...",
          "content": "Agreed, well done!",
          "cardId": "d1e2f3g4-...",
          "userId": "b2c3d4e5-...",
          "parentId": "e1f2g3h4-...",
          "user": { "id": "b2c3d4e5-...", "name": "Jane Doe", "email": "jane@example.com" },
          "createdAt": "2026-03-16T10:01:00.000Z",
          "updatedAt": "2026-03-16T10:01:00.000Z"
        }
      ],
      "createdAt": "2026-03-16T10:00:00.000Z",
      "updatedAt": "2026-03-16T10:00:00.000Z"
    }
  ]
}
```

---

### Update Comment

```http
PATCH /api/comments/:id
Authorization: Bearer <token>
```

Only the comment owner can edit. Returns `403` if another user attempts it.

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "id": "e1f2g3h4-...",
    "content": "Updated comment text",
    "cardId": "d1e2f3g4-...",
    "userId": "a1b2c3d4-...",
    "parentId": null,
    "user": { "id": "a1b2c3d4-...", "name": "John Doe", "email": "user@example.com" },
    "createdAt": "2026-03-16T10:00:00.000Z",
    "updatedAt": "2026-03-16T11:00:00.000Z"
  }
}
```

> **WebSocket:** Emits `comment:updated` to all clients in the board room.

---

### Delete Comment

```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

Only the comment owner can delete. Deleting a parent comment cascades and removes all its replies at the database level.

**Response `200`:**
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": null
}
```

> **WebSocket:** Emits `comment:deleted` to all clients in the board room.

---

## Real-Time WebSocket

The API uses Socket.io. Connect to the same server URL — no separate port needed.

### Connect

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});

socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('connect_error', (err) => console.error('Auth failed:', err.message));
```

Unauthenticated connections are rejected at the handshake level.

### Board Rooms

Join a board room to receive all events scoped to that board:

```javascript
socket.emit('join:board', 'board-uuid');

// Leave when navigating away
socket.emit('leave:board', 'board-uuid');
```

### Events Reference

| Event | Trigger | Payload |
|-------|---------|---------|
| `card:created` | Card created | `{ card, boardId, columnId }` |
| `card:updated` | Card updated | `{ card, boardId, columnId }` |
| `card:moved` | Card moved | `{ card, boardId, sourceColumnId, targetColumnId, targetPosition }` |
| `card:deleted` | Card deleted | `{ cardId, boardId, columnId }` |
| `comment:created` | Comment or reply created | `{ comment, boardId, cardId }` |
| `comment:updated` | Comment edited | `{ comment, boardId, cardId }` |
| `comment:deleted` | Comment deleted | `{ commentId, boardId, cardId }` |

### Listening to Events

```javascript
socket.on('card:created', ({ card, boardId, columnId }) => {
  console.log('New card added:', card.title);
});

socket.on('card:moved', ({ card, sourceColumnId, targetColumnId }) => {
  console.log(`Card moved from ${sourceColumnId} to ${targetColumnId}`);
});

socket.on('comment:created', ({ comment, cardId }) => {
  console.log('New comment on card', cardId, ':', comment.content);
});
```

### Full Event Payloads

**`card:created`**
```json
{
  "card": { "id": "uuid", "title": "New Card", "position": 0, "version": 1, "columnId": "uuid" },
  "boardId": "uuid",
  "columnId": "uuid"
}
```

**`card:updated`**
```json
{
  "card": { "id": "uuid", "title": "Updated Card", "position": 0, "version": 2, "columnId": "uuid" },
  "boardId": "uuid",
  "columnId": "uuid"
}
```

**`card:moved`**
```json
{
  "card": { "id": "uuid", "title": "Moved Card", "position": 2, "version": 3, "columnId": "target-column-uuid" },
  "boardId": "uuid",
  "sourceColumnId": "source-column-uuid",
  "targetColumnId": "target-column-uuid",
  "targetPosition": 2
}
```

**`card:deleted`**
```json
{
  "cardId": "uuid",
  "boardId": "uuid",
  "columnId": "uuid"
}
```

**`comment:created`**
```json
{
  "comment": { "id": "uuid", "content": "Nice work!", "cardId": "uuid", "parentId": null },
  "boardId": "uuid",
  "cardId": "uuid"
}
```

**`comment:updated`**
```json
{
  "comment": { "id": "uuid", "content": "Updated text", "cardId": "uuid" },
  "boardId": "uuid",
  "cardId": "uuid"
}
```

**`comment:deleted`**
```json
{
  "commentId": "uuid",
  "boardId": "uuid",
  "cardId": "uuid"
}
```

---

## Error Reference

All error responses follow this format:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

| Status Code | Meaning | Common Cause |
|-------------|---------|--------------|
| `400` | Bad Request | Malformed request body |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Valid token but resource belongs to another user, or nesting limit exceeded |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Optimistic lock version mismatch |
| `422` | Validation Error | Zod schema validation failed (invalid field types, missing required fields) |
| `500` | Internal Server Error | Unexpected server error |

---

## Rate Limiting

All `/api/*` endpoints are rate-limited to **100 requests per 15 minutes per IP address**.

Exceeding the limit returns:

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later"
}
```

---

## Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, receive JWT |
| POST | `/api/boards` | Yes | Create board |
| GET | `/api/boards` | Yes | List boards (paginated) |
| GET | `/api/boards/:id` | Yes | Get board with columns |
| PATCH | `/api/boards/:id` | Yes | Update board |
| DELETE | `/api/boards/:id` | Yes | Delete board (cascades) |
| POST | `/api/columns` | Yes | Create column |
| GET | `/api/columns/board/:boardId` | Yes | List columns in board |
| PATCH | `/api/columns/:id` | Yes | Update column |
| DELETE | `/api/columns/:id` | Yes | Delete column (cascades) |
| POST | `/api/cards` | Yes | Create card |
| GET | `/api/cards/column/:columnId` | Yes | List cards (paginated) |
| PATCH | `/api/cards/:id` | Yes | Update card (optimistic lock) |
| POST | `/api/cards/:id/move` | Yes | Move card within/across columns |
| DELETE | `/api/cards/:id` | Yes | Delete card |
| POST | `/api/cards/:id/tags` | Yes | Assign tags to card |
| POST | `/api/tags` | Yes | Create tag |
| GET | `/api/tags` | Yes | List all tags |
| POST | `/api/comments` | Yes | Create comment or reply |
| GET | `/api/comments/card/:cardId` | Yes | List comments with replies |
| PATCH | `/api/comments/:id` | Yes | Edit own comment |
| DELETE | `/api/comments/:id` | Yes | Delete own comment (cascades replies) |

**Total: 23 HTTP endpoints + WebSocket**
