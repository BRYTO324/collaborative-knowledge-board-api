# Project Structure

Complete folder and file structure of the Collaborative Knowledge Board API.

```
collaborative-knowledge-board-api/
│
├── prisma/
│   └── schema.prisma                 # Database schema with all models
│
├── src/
│   ├── config/
│   │   ├── database.ts               # Prisma client initialization
│   │   └── env.ts                    # Environment variable validation
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT authentication middleware
│   │   ├── error.middleware.ts       # Global error handler
│   │   └── notFound.middleware.ts    # 404 handler
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts    # Register, login endpoints
│   │   │   ├── auth.service.ts       # Auth business logic
│   │   │   ├── auth.repository.ts    # User database operations
│   │   │   ├── auth.validator.ts     # Zod schemas for auth
│   │   │   └── auth.routes.ts        # Auth route definitions
│   │   │
│   │   ├── board/
│   │   │   ├── board.controller.ts   # Board CRUD endpoints
│   │   │   ├── board.service.ts      # Board business logic
│   │   │   ├── board.repository.ts   # Board database operations
│   │   │   ├── board.validator.ts    # Zod schemas for boards
│   │   │   └── board.routes.ts       # Board route definitions
│   │   │
│   │   ├── column/
│   │   │   ├── column.controller.ts  # Column CRUD endpoints
│   │   │   ├── column.service.ts     # Column business logic
│   │   │   ├── column.repository.ts  # Column database operations
│   │   │   ├── column.validator.ts   # Zod schemas for columns
│   │   │   └── column.routes.ts      # Column route definitions
│   │   │
│   │   ├── card/
│   │   │   ├── card.controller.ts    # Card CRUD + tag assignment
│   │   │   ├── card.service.ts       # Card business logic
│   │   │   ├── card.repository.ts    # Card database operations
│   │   │   ├── card.validator.ts     # Zod schemas for cards
│   │   │   └── card.routes.ts        # Card route definitions
│   │   │
│   │   ├── comment/
│   │   │   ├── comment.controller.ts # Comment CRUD endpoints
│   │   │   ├── comment.service.ts    # Comment business logic
│   │   │   ├── comment.repository.ts # Comment database operations
│   │   │   ├── comment.validator.ts  # Zod schemas for comments
│   │   │   └── comment.routes.ts     # Comment route definitions
│   │   │
│   │   └── tag/
│   │       ├── tag.controller.ts     # Tag CRUD endpoints
│   │       ├── tag.service.ts        # Tag business logic
│   │       ├── tag.repository.ts     # Tag database operations
│   │       ├── tag.validator.ts      # Zod schemas for tags
│   │       └── tag.routes.ts         # Tag route definitions
│   │
│   ├── utils/
│   │   ├── errors.ts                 # Custom error classes
│   │   ├── logger.ts                 # Logging utility
│   │   └── response.ts               # Response formatters
│   │
│   ├── app.ts                        # Express app configuration
│   └── server.ts                     # Server entry point
│
├── .env.example                      # Environment variables template
├── .eslintrc.json                    # ESLint configuration
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Prettier configuration
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
│
├── API_DOCUMENTATION.md              # Complete API reference
├── ARCHITECTURE.md                   # Architecture deep dive
├── LOOM_SCRIPT.md                    # Video walkthrough script
├── PROJECT_STRUCTURE.md              # This file
├── QUICK_START.md                    # 5-minute setup guide
├── README.md                         # Main documentation
└── postman_collection.json           # Postman API collection
```

## File Responsibilities

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Template for environment variables |
| `.eslintrc.json` | Code linting rules |
| `.prettierrc` | Code formatting rules |
| `tsconfig.json` | TypeScript compiler options (strict mode) |
| `package.json` | Dependencies, scripts, project metadata |

### Source Code Structure

#### `/src/config/`
Configuration and initialization code that runs once at startup.

- `database.ts` - Prisma client singleton, connection management
- `env.ts` - Validates environment variables using Zod

#### `/src/middleware/`
Express middleware functions that process requests.

- `auth.middleware.ts` - Verifies JWT tokens, extracts user ID
- `error.middleware.ts` - Catches all errors, formats responses
- `notFound.middleware.ts` - Handles 404 errors

#### `/src/modules/`
Domain-driven modules, each self-contained.

Each module follows the same pattern:
- **controller.ts** - HTTP layer (thin)
- **service.ts** - Business logic (thick)
- **repository.ts** - Database operations
- **validator.ts** - Zod schemas
- **routes.ts** - Route definitions

#### `/src/utils/`
Shared utilities used across modules.

- `errors.ts` - Custom error classes (NotFoundError, UnauthorizedError, etc.)
- `logger.ts` - Structured logging with timestamps
- `response.ts` - Standardized success/error response formatters

#### `/src/app.ts`
Express application setup:
- Middleware registration (helmet, cors, rate limiting)
- Body parsing
- Route mounting
- Error handling

#### `/src/server.ts`
Server entry point:
- Starts HTTP server
- Graceful shutdown handling
- Environment logging

### Database

#### `/prisma/schema.prisma`
Single source of truth for database schema:
- Model definitions
- Relationships
- Indexes
- Constraints

### Documentation

| File | Content |
|------|---------|
| `README.md` | Main documentation, architecture overview, setup |
| `API_DOCUMENTATION.md` | Complete endpoint reference with examples |
| `ARCHITECTURE.md` | Deep dive into architecture decisions |
| `QUICK_START.md` | 5-minute setup guide |
| `LOOM_SCRIPT.md` | Video walkthrough script |
| `PROJECT_STRUCTURE.md` | This file - folder structure explanation |

### Testing & Development

| File | Purpose |
|------|---------|
| `postman_collection.json` | Importable Postman collection for API testing |

## Module Pattern

Every domain module follows this consistent structure:

```
module/
├── [module].controller.ts    # Thin layer, HTTP concerns only
├── [module].service.ts        # Thick layer, all business logic
├── [module].repository.ts     # Database operations only
├── [module].validator.ts      # Zod schemas for validation
└── [module].routes.ts         # Route definitions
```

**Benefits:**
- Predictable structure
- Easy to navigate
- Clear separation of concerns
- Testable layers

## Import Patterns

### Controllers import:
- Service (same module)
- Validator (same module)
- Response utilities
- Middleware types

### Services import:
- Repository (same module)
- Other repositories (for cross-module operations)
- Error classes
- Validator types

### Repositories import:
- Prisma client
- Prisma types

### Routes import:
- Controller (same module)
- Middleware (auth)

## Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `auth.middleware.ts`)
- **Classes:** `PascalCase` (e.g., `BoardService`)
- **Functions:** `camelCase` (e.g., `createBoard`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`)
- **Interfaces:** `PascalCase` with `I` prefix (e.g., `IAuthRequest`)
- **Types:** `PascalCase` (e.g., `CreateBoardInput`)

## Code Organization Principles

1. **Colocation:** Related code lives together
2. **Separation:** Different concerns in different files
3. **Consistency:** Same pattern across all modules
4. **Discoverability:** Easy to find what you need
5. **Scalability:** Easy to add new modules

## Adding a New Module

To add a new domain module (e.g., "notification"):

1. Create folder: `src/modules/notification/`
2. Create files:
   - `notification.controller.ts`
   - `notification.service.ts`
   - `notification.repository.ts`
   - `notification.validator.ts`
   - `notification.routes.ts`
3. Add model to `prisma/schema.prisma`
4. Run migration: `npm run prisma:migrate`
5. Mount routes in `src/app.ts`

The existing architecture supports this without modifications.
