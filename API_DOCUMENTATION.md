# Collaborative Knowledge Board API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### Authentication

#### Register User
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

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### Login
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

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

---

### Boards

#### Create Board
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

**Response (201):**
```json
{
  "success": true,
  "message": "Board created successfully",
  "data": {
    "id": "uuid",
    "title": "My Project Board",
    "description": "Project management board",
    "userId": "uuid",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

#### Get All User Boards
```http
GET /api/boards?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "message": "Boards retrieved successfully",
  "data": {
    "boards": [
      {
        "id": "uuid",
        "title": "My Project Board",
        "description": "Project management board",
        "userId": "uuid",
        "columns": [],
        "createdAt": "2026-03-03T10:00:00.000Z",
        "updatedAt": "2026-03-03T10:00:00.000Z"
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

#### Get Board by ID
```http
GET /api/boards/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "My Project Board",
    "description": "Project management board",
    "userId": "uuid",
    "columns": [
      {
        "id": "uuid",
        "title": "To Do",
        "position": 0,
        "boardId": "uuid"
      }
    ],
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

#### Update Board
```http
PATCH /api/boards/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Board Title",
  "description": "Updated description"
}
```

#### Delete Board
```http
DELETE /api/boards/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board deleted successfully",
  "data": null
}
```

---

### Columns

#### Create Column
```http
POST /api/columns
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "To Do",
  "boardId": "board_uuid",
  "position": 0
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Column created successfully",
  "data": {
    "id": "uuid",
    "title": "To Do",
    "position": 0,
    "boardId": "board_uuid",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

#### Update Column
```http
PATCH /api/columns/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "In Progress",
  "position": 1
}
```

#### Delete Column
```http
DELETE /api/columns/:id
Authorization: Bearer <token>
```

---

### Cards

#### Create Card
```http
POST /api/cards
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based authentication",
  "columnId": "column_uuid",
  "position": 0,
  "dueDate": "2026-03-10T00:00:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Card created successfully",
  "data": {
    "id": "uuid",
    "title": "Implement authentication",
    "description": "Add JWT-based authentication",
    "dueDate": "2026-03-10T00:00:00.000Z",
    "position": 0,
    "version": 1,
    "columnId": "column_uuid",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

#### Get Cards by Column
```http
GET /api/cards/column/:columnId?page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "message": "Cards retrieved successfully",
  "data": {
    "cards": [
      {
        "id": "uuid",
        "title": "Implement authentication",
        "position": 0,
        "version": 1,
        "columnId": "column_uuid",
        "tags": [],
        "createdAt": "2026-03-03T10:00:00.000Z",
        "updatedAt": "2026-03-03T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

#### Update Card
```http
PATCH /api/cards/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "dueDate": "2026-03-15T00:00:00.000Z",
  "version": 1
}
```

> **Optimistic Locking:** If you include `version` in the request body, the API will check it against the current card version. If they don't match (another user updated the card), a `409 Conflict` is returned. Omit `version` to skip the conflict check.

**Conflict Response (409):**
```json
{
  "success": false,
  "message": "Card has been modified by another user. Please refresh and try again."
}
```

#### Move Card
```http
POST /api/cards/:id/move
Authorization: Bearer <token>
```

Moves a card to a target column and position. Works for both within-column reordering and cross-column moves. All affected card positions are updated atomically in a single transaction — no duplicate positions will result.

**Request Body:**
```json
{
  "targetColumnId": "column_uuid",
  "targetPosition": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Card moved successfully",
  "data": {
    "id": "uuid",
    "title": "Implement authentication",
    "position": 2,
    "columnId": "column_uuid",
    "version": 2,
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

**Ordering Strategy:**
- Within-column move: cards between the old and new position are shifted by ±1 to make room.
- Cross-column move: cards above the removed position in the source column shift up; cards at or below the target position in the destination column shift down.
- All operations run inside a Prisma transaction to prevent race conditions and duplicate positions.

#### Delete Card
```http
DELETE /api/cards/:id
Authorization: Bearer <token>
```

#### Assign Tags to Card
```http
POST /api/cards/:id/tags
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "tagIds": ["tag_uuid_1", "tag_uuid_2"]
}
```

---

### Tags

#### Create Tag
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

**Response (201):**
```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "id": "uuid",
    "name": "urgent",
    "color": "#FF0000",
    "createdAt": "2026-03-03T10:00:00.000Z"
  }
}
```

#### Get All Tags
```http
GET /api/tags
Authorization: Bearer <token>
```

---

### Comments

Comments support two levels of threading: top-level comments and one level of replies. Replies to replies are rejected.

#### Create Comment
```http
POST /api/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "cardId": "card_uuid",
  "content": "This looks good!"
}
```

To create a threaded reply, include `parentId`:
```json
{
  "cardId": "card_uuid",
  "content": "Agreed, nice work!",
  "parentId": "parent_comment_uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "uuid",
    "content": "This looks good!",
    "cardId": "card_uuid",
    "userId": "user_uuid",
    "parentId": null,
    "user": {
      "id": "user_uuid",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

**Nesting Rules:**
- `parentId: null` — top-level comment
- `parentId: <uuid>` — reply to a top-level comment
- Replying to a reply returns `403 Forbidden` (max 2 levels enforced)

#### Get Comments by Card
```http
GET /api/comments/card/:cardId
Authorization: Bearer <token>
```

Returns only top-level comments. Each comment includes its `replies` array.

**Response (200):**
```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "content": "This looks good!",
      "cardId": "card_uuid",
      "userId": "user_uuid",
      "parentId": null,
      "user": {
        "id": "user_uuid",
        "name": "John Doe",
        "email": "user@example.com"
      },
      "replies": [
        {
          "id": "uuid",
          "content": "Agreed!",
          "parentId": "parent_uuid",
          "user": {
            "id": "user_uuid",
            "name": "Jane Doe",
            "email": "jane@example.com"
          },
          "createdAt": "2026-03-03T10:01:00.000Z",
          "updatedAt": "2026-03-03T10:01:00.000Z"
        }
      ],
      "createdAt": "2026-03-03T10:00:00.000Z",
      "updatedAt": "2026-03-03T10:00:00.000Z"
    }
  ]
}
```

#### Update Comment
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

**Response (200):**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "id": "uuid",
    "content": "Updated comment text",
    "cardId": "card_uuid",
    "userId": "user_uuid",
    "parentId": null,
    "user": {
      "id": "user_uuid",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:05:00.000Z"
  }
}
```

#### Delete Comment
```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

Only the comment owner can delete. Deleting a parent comment cascades and removes all its replies.

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": null
}
```

---

## Real-Time Events (WebSocket)

The API uses Socket.io for real-time updates. Connect to the WebSocket server at the same base URL.

### Connection

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});
```

### Joining a Board Room

After connecting, join a board room to receive events for that board:

```js
socket.emit('join:board', 'board_uuid');

// Leave when done
socket.emit('leave:board', 'board_uuid');
```

### Events

All events are scoped to the board room. You only receive events for boards you have joined.

| Event | Trigger |
|-------|---------|
| `card:created` | A card is created in the board |
| `card:updated` | A card is updated |
| `card:moved` | A card is moved to a new column or position |
| `card:deleted` | A card is deleted |
| `comment:created` | A comment is added to a card |
| `comment:updated` | A comment is edited |
| `comment:deleted` | A comment is deleted |

### Event Payloads

**`card:created`**
```json
{
  "card": { "id": "uuid", "title": "New Card", "position": 0, "columnId": "uuid" },
  "boardId": "uuid",
  "columnId": "uuid"
}
```

**`card:moved`**
```json
{
  "card": { "id": "uuid", "title": "Moved Card", "position": 2, "columnId": "uuid" },
  "boardId": "uuid",
  "sourceColumnId": "uuid",
  "targetColumnId": "uuid",
  "targetPosition": 2
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

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — valid token but insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — optimistic lock version mismatch |
| 422 | Validation Error — invalid request body |
| 500 | Internal Server Error |

---

## Rate Limiting

100 requests per 15 minutes per IP address, applied to all `/api/*` endpoints.
