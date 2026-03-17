# API Reference

Complete API documentation for the Collaborative Knowledge Board API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `password`: Minimum 6 characters
- `name`: Minimum 1 character, maximum 100 characters

**Success Response:** `201 Created`
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

**Error Responses:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Email already registered

---

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response:** `200 OK`
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

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid credentials

---

## Board Endpoints

### List Boards

Get all boards for the authenticated user with pagination.

**Endpoint:** `GET /api/boards`

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 20

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Boards retrieved successfully",
  "data": {
    "boards": [
      {
        "id": "uuid",
        "title": "My Project Board",
        "description": "Project management",
        "userId": "uuid",
        "createdAt": "2024-03-09T10:00:00.000Z",
        "updatedAt": "2024-03-09T10:00:00.000Z",
        "columns": [...]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### Create Board

Create a new board.

**Endpoint:** `POST /api/boards`

**Request Body:**
```json
{
  "title": "My Project Board",
  "description": "Project management board"
}
```

**Validation Rules:**
- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Board created successfully",
  "data": {
    "id": "uuid",
    "title": "My Project Board",
    "description": "Project management board",
    "userId": "uuid",
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:00:00.000Z"
  }
}
```

---

### Get Board

Get a specific board with all columns.

**Endpoint:** `GET /api/boards/:id`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Board retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "My Project Board",
    "description": "Project management board",
    "userId": "uuid",
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:00:00.000Z",
    "columns": [
      {
        "id": "uuid",
        "title": "To Do",
        "position": 0,
        "boardId": "uuid",
        "createdAt": "2024-03-09T10:00:00.000Z",
        "updatedAt": "2024-03-09T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- `404 Not Found` - Board doesn't exist
- `403 Forbidden` - Not board owner

---

### Update Board

Update board properties.

**Endpoint:** `PATCH /api/boards/:id`

**Request Body:**
```json
{
  "title": "Updated Board Title",
  "description": "Updated description"
}
```

**Validation Rules:**
- `title`: Optional, 1-200 characters
- `description`: Optional, max 1000 characters

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Board updated successfully",
  "data": {
    "id": "uuid",
    "title": "Updated Board Title",
    "description": "Updated description",
    "userId": "uuid",
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:30:00.000Z"
  }
}
```

---

### Delete Board

Delete a board and all its contents.

**Endpoint:** `DELETE /api/boards/:id`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Board deleted successfully",
  "data": null
}
```

**Note:** Deletes all columns, cards, and comments associated with the board.

---

## Column Endpoints

### Create Column

Create a new column in a board.

**Endpoint:** `POST /api/columns`

**Request Body:**
```json
{
  "boardId": "uuid",
  "title": "In Progress",
  "position": 1
}
```

**Validation Rules:**
- `boardId`: Required, valid UUID
- `title`: Required, 1-100 characters
- `position`: Optional, non-negative integer

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Column created successfully",
  "data": {
    "id": "uuid",
    "title": "In Progress",
    "position": 1,
    "boardId": "uuid",
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:00:00.000Z"
  }
}
```

---

### List Columns

Get all columns for a board.

**Endpoint:** `GET /api/columns/board/:boardId`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Columns retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "To Do",
      "position": 0,
      "boardId": "uuid",
      "createdAt": "2024-03-09T10:00:00.000Z",
      "updatedAt": "2024-03-09T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "title": "In Progress",
      "position": 1,
      "boardId": "uuid",
      "createdAt": "2024-03-09T10:00:00.000Z",
      "updatedAt": "2024-03-09T10:00:00.000Z"
    }
  ]
}
```

---

### Update Column

Update column properties.

**Endpoint:** `PATCH /api/columns/:id`

**Request Body:**
```json
{
  "title": "Done",
  "position": 2
}
```

**Success Response:** `200 OK`

---

### Delete Column

Delete a column and all its cards.

**Endpoint:** `DELETE /api/columns/:id`

**Success Response:** `200 OK`

---

## Card Endpoints

### Create Card

Create a new card in a column.

**Endpoint:** `POST /api/cards`

**Request Body:**
```json
{
  "columnId": "uuid",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "dueDate": "2024-12-31T23:59:59Z",
  "position": 0
}
```

**Validation Rules:**
- `columnId`: Required, valid UUID
- `title`: Required, 1-200 characters
- `description`: Optional, max 2000 characters
- `dueDate`: Optional, ISO 8601 datetime
- `position`: Optional, non-negative integer

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Card created successfully",
  "data": {
    "id": "uuid",
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication system",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "position": 0,
    "version": 1,
    "columnId": "uuid",
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:00:00.000Z"
  }
}
```

---

### List Cards

Get all cards in a column with pagination.

**Endpoint:** `GET /api/cards/column/:columnId`

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 50

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cards retrieved successfully",
  "data": {
    "cards": [
      {
        "id": "uuid",
        "title": "Implement user authentication",
        "description": "Add JWT-based authentication system",
        "dueDate": "2024-12-31T23:59:59.000Z",
        "position": 0,
        "version": 1,
        "columnId": "uuid",
        "createdAt": "2024-03-09T10:00:00.000Z",
        "updatedAt": "2024-03-09T10:00:00.000Z",
        "tags": [
          {
            "cardId": "uuid",
            "tagId": "uuid",
            "tag": {
              "id": "uuid",
              "name": "Backend",
              "color": "#3B82F6"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 120,
      "totalPages": 3
    }
  }
}
```

---

### Update Card

Update card properties with optimistic locking support.

**Endpoint:** `PATCH /api/cards/:id`

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "dueDate": "2024-12-31T23:59:59Z",
  "version": 1
}
```

**Validation Rules:**
- `title`: Optional, 1-200 characters
- `description`: Optional, max 2000 characters
- `dueDate`: Optional, ISO 8601 datetime or null
- `version`: Optional, integer (for optimistic locking)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Card updated successfully",
  "data": {
    "id": "uuid",
    "title": "Updated title",
    "description": "Updated description",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "position": 0,
    "version": 2,
    "columnId": "uuid",
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `409 Conflict` - Version mismatch (card was modified by another user)

---

### Move Card

Move a card to a different position or column.

**Endpoint:** `POST /api/cards/:id/move`

**Request Body:**
```json
{
  "targetColumnId": "uuid",
  "targetPosition": 2
}
```

**Validation Rules:**
- `targetColumnId`: Required, valid UUID
- `targetPosition`: Required, non-negative integer

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Card moved successfully",
  "data": {
    "id": "uuid",
    "title": "Card title",
    "description": "Card description",
    "position": 2,
    "version": 2,
    "columnId": "uuid",
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:30:00.000Z"
  }
}
```

**Notes:**
- Automatically adjusts positions of other cards
- Uses database transactions for consistency
- Increments card version

---

### Delete Card

Delete a card and all its comments.

**Endpoint:** `DELETE /api/cards/:id`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Card deleted successfully",
  "data": null
}
```

---

### Assign Tags

Assign tags to a card.

**Endpoint:** `POST /api/cards/:id/tags`

**Request Body:**
```json
{
  "tagIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Validation Rules:**
- `tagIds`: Required, array of valid UUIDs

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Tags assigned successfully",
  "data": {
    "id": "uuid",
    "title": "Card title",
    "tags": [
      {
        "cardId": "uuid",
        "tagId": "uuid1",
        "tag": {
          "id": "uuid1",
          "name": "Backend",
          "color": "#3B82F6"
        }
      }
    ]
  }
}
```

---

## Comment Endpoints

### Create Comment

Create a comment or reply on a card.

**Endpoint:** `POST /api/comments`

**Request Body (Top-level comment):**
```json
{
  "cardId": "uuid",
  "content": "This is a comment"
}
```

**Request Body (Reply):**
```json
{
  "cardId": "uuid",
  "content": "This is a reply",
  "parentId": "parent-comment-uuid"
}
```

**Validation Rules:**
- `cardId`: Required, valid UUID
- `content`: Required, 1-2000 characters
- `parentId`: Optional, valid UUID (for replies)

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "uuid",
    "content": "This is a comment",
    "cardId": "uuid",
    "userId": "uuid",
    "parentId": null,
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:00:00.000Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- `403 Forbidden` - Cannot reply to a reply (max 2 levels)
- `404 Not Found` - Parent comment not found

---

### List Comments

Get all comments for a card with replies.

**Endpoint:** `GET /api/comments/card/:cardId`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "content": "Parent comment",
      "cardId": "uuid",
      "userId": "uuid",
      "parentId": null,
      "createdAt": "2024-03-09T10:00:00.000Z",
      "updatedAt": "2024-03-09T10:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "replies": [
        {
          "id": "uuid",
          "content": "Reply to parent",
          "cardId": "uuid",
          "userId": "uuid",
          "parentId": "parent-uuid",
          "createdAt": "2024-03-09T10:05:00.000Z",
          "updatedAt": "2024-03-09T10:05:00.000Z",
          "user": {
            "id": "uuid",
            "name": "Jane Smith",
            "email": "jane@example.com"
          }
        }
      ]
    }
  ]
}
```

---

### Update Comment

Update comment content (own comments only).

**Endpoint:** `PATCH /api/comments/:id`

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Validation Rules:**
- `content`: Required, 1-2000 characters

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "id": "uuid",
    "content": "Updated comment text",
    "cardId": "uuid",
    "userId": "uuid",
    "parentId": null,
    "createdAt": "2024-03-09T10:00:00.000Z",
    "updatedAt": "2024-03-09T10:30:00.000Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- `403 Forbidden` - Can only edit own comments

---

### Delete Comment

Delete a comment (own comments only).

**Endpoint:** `DELETE /api/comments/:id`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": null
}
```

**Error Responses:**
- `403 Forbidden` - Can only delete own comments

**Notes:**
- Deleting a parent comment also deletes all replies

---

## Tag Endpoints

### Create Tag

Create a new tag.

**Endpoint:** `POST /api/tags`

**Request Body:**
```json
{
  "name": "Backend",
  "color": "#3B82F6"
}
```

**Validation Rules:**
- `name`: Required, 1-50 characters, unique
- `color`: Optional, hex color code, default: "#3B82F6"

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "id": "uuid",
    "name": "Backend",
    "color": "#3B82F6",
    "createdAt": "2024-03-09T10:00:00.000Z"
  }
}
```

---

### List Tags

Get all available tags.

**Endpoint:** `GET /api/tags`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Backend",
      "color": "#3B82F6",
      "createdAt": "2024-03-09T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Frontend",
      "color": "#10B981",
      "createdAt": "2024-03-09T10:00:00.000Z"
    }
  ]
}
```

---

## WebSocket Events

### Connection

Connect to WebSocket server with JWT authentication.

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### Join Board Room

```javascript
socket.emit('join:board', boardId);
```

### Leave Board Room

```javascript
socket.emit('leave:board', boardId);
```

### Event Listeners

#### Card Created
```javascript
socket.on('card:created', (data) => {
  console.log('New card:', data);
  // data: { card, boardId, columnId }
});
```

#### Card Updated
```javascript
socket.on('card:updated', (data) => {
  console.log('Card updated:', data);
  // data: { card, boardId, columnId }
});
```

#### Card Moved
```javascript
socket.on('card:moved', (data) => {
  console.log('Card moved:', data);
  // data: { card, boardId, sourceColumnId, targetColumnId, targetPosition }
});
```

#### Card Deleted
```javascript
socket.on('card:deleted', (data) => {
  console.log('Card deleted:', data);
  // data: { cardId, boardId, columnId }
});
```

#### Comment Created
```javascript
socket.on('comment:created', (data) => {
  console.log('New comment:', data);
  // data: { comment, boardId, cardId }
});
```

#### Comment Updated
```javascript
socket.on('comment:updated', (data) => {
  console.log('Comment updated:', data);
  // data: { comment, boardId, cardId }
});
```

#### Comment Deleted
```javascript
socket.on('comment:deleted', (data) => {
  console.log('Comment deleted:', data);
  // data: { commentId, boardId, cardId }
});
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Window:** 15 minutes
- **Max Requests:** 100 per IP address

**Response when rate limit exceeded:**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later"
}
```

---

## Error Codes Summary

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (version mismatch) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## Postman Collection

A Postman collection is available at `postman_collection.json` in the project root with all endpoints pre-configured.

Import it into Postman for easy API testing.

---

For implementation details, see [Technical Documentation](./TECHNICAL_DOCUMENTATION.md).
