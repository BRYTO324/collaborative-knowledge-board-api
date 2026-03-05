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
GET /api/boards
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Boards retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "My Project Board",
      "description": "Project management board",
      "userId": "uuid",
      "columns": [],
      "createdAt": "2026-03-03T10:00:00.000Z",
      "updatedAt": "2026-03-03T10:00:00.000Z"
    }
  ]
}
```

#### Get Board by ID
```http
GET /api/boards/:id
Authorization: Bearer <token>
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
    "columnId": "column_uuid",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

#### Get Cards by Column
```http
GET /api/cards/column/:columnId
Authorization: Bearer <token>
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
  "position": 1,
  "dueDate": "2026-03-15T00:00:00.000Z"
}
```

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

#### Create Comment
```http
POST /api/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "This looks good!",
  "cardId": "card_uuid"
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

#### Get Comments by Card
```http
GET /api/comments/card/:cardId
Authorization: Bearer <token>
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {} // Only in development mode
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Applies to all `/api/*` endpoints
