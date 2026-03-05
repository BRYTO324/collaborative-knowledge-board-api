# Collaborative Knowledge Board API

A production-ready RESTful API for collaborative workspace management, built with Node.js, TypeScript, Express, PostgreSQL, and Prisma ORM.

## 🎯 Project Overview

This backend system powers a collaborative knowledge board application where users can:
- Create and manage multiple boards
- Organize work into columns (e.g., "To Do", "In Progress", "Done")
- Create cards within columns with descriptions and due dates
- Tag cards for categorization
- Comment on cards for team collaboration

## 🏗️ Architecture

### Layered Architecture Pattern

The application follows a strict **4-layer architecture** for separation of concerns:

```
┌─────────────────────────────────────────┐
│          Routes Layer                   │  HTTP endpoint definitions
├─────────────────────────────────────────┤
│        Controller Layer                 │  Request/response handling
├─────────────────────────────────────────┤
│         Service Layer                   │  Business logic
├─────────────────────────────────────────┤
│       Repository Layer                  │  Database operations
└─────────────────────────────────────────┘
```

**Why this architecture?**
- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Layers can be tested independently
- **Maintainability**: Changes in one layer don't cascade to others
- **Scalability**: Easy to add new features without breaking existing code

### Request Lifecycle

```
Client Request
    ↓
Route Definition
    ↓
Authentication Middleware (if protected)
    ↓
Controller (validates input with Zod)
    ↓
Service (business logic)
    ↓
Repository (database query)
    ↓
Database (PostgreSQL via Prisma)
    ↓
Response (standardized format)
```

## 📁 Folder Structure

```
collaborative-knowledge-board-api/
├── prisma/
│   └── schema.prisma              # Database schema
├── src/
│   ├── config/
│   │   ├── database.ts            # Prisma client setup
│   │   └── env.ts                 # Environment validation
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT authentication
│   │   ├── error.middleware.ts    # Global error handler
│   │   └── notFound.middleware.ts # 404 handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.validator.ts
│   │   │   └── auth.routes.ts
│   │   ├── board/                 # Board module
│   │   ├── column/                # Column module
│   │   ├── card/                  # Card module
│   │   ├── comment/               # Comment module
│   │   └── tag/                   # Tag module
│   ├── utils/
│   │   ├── errors.ts              # Custom error classes
│   │   ├── logger.ts              # Logging utility
│   │   └── response.ts            # Response formatters
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

### Folder Structure Reasoning

**Module-based organization**: Each domain (auth, board, card, etc.) is self-contained with its own controller, service, repository, validator, and routes. This makes the codebase:
- Easy to navigate
- Simple to add new features
- Clear ownership of responsibilities

**Shared utilities**: Common functionality (errors, logging, responses) is centralized to avoid duplication.

## 🗄️ Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Board : owns
    User ||--o{ Comment : writes
    Board ||--o{ Column : contains
    Column ||--o{ Card : contains
    Card ||--o{ Comment : has
    Card }o--o{ Tag : tagged_with
    
    User {
        uuid id PK
        string email UK
        string password
        string name
        datetime createdAt
        datetime updatedAt
    }
    
    Board {
        uuid id PK
        string title
        string description
        uuid userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Column {
        uuid id PK
        string title
        int position
        uuid boardId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Card {
        uuid id PK
        string title
        string description
        datetime dueDate
        int position
        uuid columnId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Tag {
        uuid id PK
        string name UK
        string color
        datetime createdAt
    }
    
    CardTag {
        uuid cardId FK
        uuid tagId FK
    }
    
    Comment {
        uuid id PK
        string content
        uuid cardId FK
        uuid userId FK
        datetime createdAt
        datetime updatedAt
    }
```

### Key Relationships

1. **User → Board** (1:N)
   - One user owns multiple boards
   - Cascade delete: Deleting a user removes their boards

2. **Board → Column** (1:N)
   - One board contains multiple columns
   - Cascade delete: Deleting a board removes its columns

3. **Column → Card** (1:N)
   - One column contains multiple cards
   - Cascade delete: Deleting a column removes its cards

4. **Card ↔ Tag** (M:N)
   - Cards can have multiple tags
   - Tags can be applied to multiple cards
   - Junction table: `CardTag`

5. **Card → Comment** (1:N)
   - One card can have multiple comments
   - Cascade delete: Deleting a card removes its comments

### Database Optimizations

- **Indexes**: Added on foreign keys and frequently queried fields (email, boardId, columnId, cardId)
- **Unique constraints**: Email and tag names are unique
- **Cascade deletes**: Proper cleanup when parent entities are deleted
- **Position fields**: Integer fields for ordering columns and cards

## 🔐 Authentication & Security

### JWT-based Authentication
- Stateless authentication using JSON Web Tokens
- Tokens expire after 7 days (configurable)
- Password hashing with bcrypt (10 rounds)

### Security Middleware
- **Helmet**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schemas validate all inputs

### Authorization
- Ownership verification: Users can only access their own boards
- Cascading permissions: Board ownership grants access to columns, cards, and comments

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd collaborative-knowledge-board-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_board?schema=public"

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=10
```

4. **Setup database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

5. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📋 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` | No |
| `BCRYPT_ROUNDS` | Password hashing rounds | `10` | No |

## 🔧 Engineering Decisions

### 1. TypeScript Strict Mode
**Decision**: Enabled all strict type checking options

**Reasoning**:
- Catches errors at compile time
- Improves code quality and maintainability
- Better IDE support and autocomplete

### 2. Prisma ORM
**Decision**: Use Prisma instead of raw SQL or other ORMs

**Reasoning**:
- Type-safe database queries
- Excellent TypeScript integration
- Migration management built-in
- Auto-generated client based on schema

### 3. Zod for Validation
**Decision**: Use Zod for runtime validation

**Reasoning**:
- Type inference from schemas
- Composable and reusable validators
- Clear error messages
- Works seamlessly with TypeScript

### 4. Repository Pattern
**Decision**: Separate database logic into repository layer

**Reasoning**:
- Database operations are isolated
- Easy to mock for testing
- Can swap database implementations
- Single source of truth for queries

### 5. Custom Error Classes
**Decision**: Create typed error classes extending base Error

**Reasoning**:
- Type-safe error handling
- Consistent error responses
- Easy to add new error types
- Clear error semantics (NotFoundError, UnauthorizedError, etc.)

### 6. Stateless Authentication
**Decision**: JWT tokens instead of sessions

**Reasoning**:
- Scalable (no server-side session storage)
- Works well with microservices
- Mobile-friendly
- Reduces database load

### 7. Position-based Ordering
**Decision**: Use integer position fields for columns and cards

**Reasoning**:
- Simple to implement
- Efficient for small to medium lists
- Easy to reorder items
- No complex sorting logic needed

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint documentation.

### Quick Example

**Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "name": "John Doe"
  }'
```

**Create a board:**
```bash
curl -X POST http://localhost:3000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My Project",
    "description": "Project management board"
  }'
```

## 🧪 Testing

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## 🔍 Code Quality Standards

- **No fat controllers**: Controllers only handle HTTP concerns
- **Single Responsibility**: Each class/function has one job
- **DRY principle**: No duplicated logic
- **Async/await**: Consistent async error handling
- **Type safety**: No `any` types (except where necessary)
- **Error handling**: All errors caught and handled gracefully

## 🚦 Production Readiness Checklist

- ✅ TypeScript strict mode enabled
- ✅ Input validation on all endpoints
- ✅ Authentication and authorization
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Centralized error handling
- ✅ Structured logging
- ✅ Environment variable validation
- ✅ Database connection pooling
- ✅ Graceful shutdown handling
- ✅ API documentation

## 📄 License

MIT

## 👤 Author

Backend Engineering Assessment Project
