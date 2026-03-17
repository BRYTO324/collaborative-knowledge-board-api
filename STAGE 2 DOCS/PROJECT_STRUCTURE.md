# Project Structure

Complete folder and file structure of the Collaborative Knowledge Board API — updated for Stage 2.

```
collaborative-knowledge-board-api/
│
├── prisma/
│   ├── schema.prisma                     # Database schema — 7 models, indexes, relationships
│   └── migrations/
│       └── 20260309165642_stage2_enhancements/
│           └── migration.sql             # Stage 2 migration: version field, comment threading, indexes
│
├── src/
│   ├── config/
│   │   ├── database.ts                   # Prisma client singleton
│   │   └── env.ts                        # Environment variable validation (Zod)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts            # JWT verification, userId extraction
│   │   ├── error.middleware.ts           # Global error handler (AppError, ZodError, unknown)
│   │   └── notFound.middleware.ts        # 404 handler
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts        # POST /register, POST /login
│   │   │   ├── auth.service.ts           # Registration, login, password hashing
│   │   │   ├── auth.repository.ts        # User lookup and creation
│   │   │   ├── auth.validator.ts         # Zod schemas: registerSchema, loginSchema
│   │   │   └── auth.routes.ts            # Public routes (no auth middleware)
│   │   │
│   │   ├── board/
│   │   │   ├── board.controller.ts       # CRUD endpoints + pagination
│   │   │   ├── board.service.ts          # Ownership checks, business logic
│   │   │   ├── board.repository.ts       # Paginated queries, cascade-aware deletes
│   │   │   ├── board.validator.ts        # Zod schemas: createBoardSchema, updateBoardSchema
│   │   │   └── board.routes.ts           # Protected routes (authenticate middleware)
│   │   │
│   │   ├── column/
│   │   │   ├── column.controller.ts      # CRUD endpoints
│   │   │   ├── column.service.ts         # Position management, board ownership checks
│   │   │   ├── column.repository.ts      # Column queries ordered by position
│   │   │   ├── column.validator.ts       # Zod schemas: createColumnSchema, updateColumnSchema
│   │   │   └── column.routes.ts          # Protected routes
│   │   │
│   │   ├── card/
│   │   │   ├── card.controller.ts        # CRUD + move + tag assignment endpoints
│   │   │   ├── card.service.ts           # Optimistic locking, move logic, WS event emission
│   │   │   ├── card.repository.ts        # Paginated queries, reorderWithinColumn, moveToColumn
│   │   │   ├── card.validator.ts         # Zod schemas: createCardSchema, updateCardSchema, moveCardSchema
│   │   │   └── card.routes.ts            # Protected routes including POST /:id/move
│   │   │
│   │   ├── comment/
│   │   │   ├── comment.controller.ts     # Full CRUD endpoints (create, list, update, delete)
│   │   │   ├── comment.service.ts        # Threading depth enforcement, ownership checks, WS events
│   │   │   ├── comment.repository.ts     # Threaded queries (top-level + nested replies in one query)
│   │   │   ├── comment.validator.ts      # Zod schemas: createCommentSchema, updateCommentSchema
│   │   │   └── comment.routes.ts         # Protected routes
│   │   │
│   │   └── tag/
│   │       ├── tag.controller.ts         # POST /tags, GET /tags
│   │       ├── tag.service.ts            # Tag creation and listing
│   │       ├── tag.repository.ts         # Tag queries
│   │       ├── tag.validator.ts          # Zod schemas: createTagSchema
│   │       └── tag.routes.ts             # Protected routes
│   │
│   ├── services/                         # ★ NEW IN STAGE 2
│   │   └── websocket.service.ts          # Socket.io server, JWT auth on handshake, board rooms, event broadcast
│   │
│   ├── utils/
│   │   ├── errors.ts                     # AppError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError
│   │   ├── logger.ts                     # Winston logger (structured JSON in production)
│   │   └── response.ts                   # sendSuccess(), sendError() helpers
│   │
│   ├── app.ts                            # Express app: middleware, route mounting, error handler
│   └── server.ts                         # HTTP + WebSocket server init, graceful shutdown
│
├── tests/                                # ★ NEW IN STAGE 2
│   ├── setup.ts                          # Jest global setup (test DB connection)
│   ├── unit/
│   │   ├── card.service.test.ts          # Unit tests: optimistic locking, CRUD, authorization
│   │   └── comment.service.test.ts       # Unit tests: threading depth, ownership, CRUD
│   └── integration/
│       ├── board.test.ts                 # Integration: board creation flow, pagination, auth
│       ├── card-move.test.ts             # Integration: move within column, cross-column, no duplicate positions
│       └── comment.test.ts              # Integration: threaded replies, edit/delete, cascade
│
├── docs/                                 # ★ NEW IN STAGE 2
│   ├── API_REFERENCE.md                  # Complete endpoint docs with request/response examples + WebSocket
│   ├── ARCHITECTURE_GUIDE.md             # Conflict handling, ordering strategy, real-time approach
│   ├── DEVELOPMENT_GUIDE.md              # Setup, workflow, testing, troubleshooting
│   └── TECHNICAL_DOCUMENTATION.md       # In-depth: DB design, indexing, transactions, error hierarchy
│
├── dist/                                 # Compiled JavaScript output (git-ignored)
│
├── .env                                  # Local environment variables (git-ignored)
├── .env.example                          # Environment variables template
├── .eslintrc.json                        # ESLint configuration
├── .gitignore                            # Git ignore rules
├── .prettierrc                           # Prettier configuration
├── jest.config.js                        # Jest configuration (ts-jest, test paths)
├── package.json                          # Dependencies and scripts
├── tsconfig.json                         # TypeScript configuration (strict mode)
│
├── README.md                             # Main documentation: setup, API overview, architecture
├── SUBMISSION.md                         # Stage 2 submission: full feature breakdown and deliverables
├── postman_collection.json               # Importable Postman collection (all 23 endpoints)
│
└── [legacy root docs — Stage 1]
    ├── API_DOCUMENTATION.md              # Original Stage 1 API docs (superseded by docs/)
    ├── ARCHITECTURE.md                   # Original Stage 1 architecture (superseded by docs/)
    ├── DATABASE_SETUP.md                 # Database setup guide
    └── QUICK_START.md                    # 5-minute setup guide
```

---

## What Changed in Stage 2

### New Folders

**`src/services/`**
Added to house shared services that don't belong to a single domain module. Currently contains the WebSocket service which is consumed by multiple modules (card, comment).

**`tests/`**
Full test suite added in Stage 2. Organized into `unit/` (service layer with mocked repositories) and `integration/` (real HTTP requests against a test database).

**`docs/`**
Dedicated documentation folder replacing the flat root-level markdown files. Contains four focused documents covering API reference, architecture decisions, development workflow, and technical specifications.

**`prisma/migrations/`**
Stage 2 migration adds the `version` field to `Card` for optimistic locking, the `parentId` self-referential field to `Comment` for threading, and all strategic indexes.

---

## File Responsibilities

### `/src/config/`
Runs once at startup. `database.ts` exports the Prisma singleton. `env.ts` validates all required environment variables with Zod and throws at startup if any are missing.

### `/src/middleware/`
Cross-cutting Express middleware.

| File | Responsibility |
|------|---------------|
| `auth.middleware.ts` | Verifies JWT, attaches `userId` to `req`, returns 401 on failure |
| `error.middleware.ts` | Catches `AppError` (uses statusCode), `ZodError` (400 with field details), unknown (500) |
| `notFound.middleware.ts` | Returns 404 for unmatched routes |

### `/src/modules/`
Six self-contained domain modules. Each follows the same 5-file pattern:

| Layer | File | Responsibility |
|-------|------|---------------|
| Routes | `*.routes.ts` | Endpoint definitions, middleware application |
| Controller | `*.controller.ts` | Parse request, call service, format response — no logic |
| Service | `*.service.ts` | Business rules, authorization, WebSocket event emission |
| Repository | `*.repository.ts` | Prisma queries, transactions, eager loading |
| Validator | `*.validator.ts` | Zod schemas, exported TypeScript types |

### `/src/services/websocket.service.ts` ★ Stage 2
Socket.io server lifecycle management. Responsibilities:
- Authenticate socket connections using JWT on handshake
- Maintain `userSockets` map (userId → Set of socketIds)
- Handle `join:board` and `leave:board` room events
- Expose `emitToBoardMembers(boardId, event, data)` for service layer use
- Clean up socket tracking on disconnect

Zero business logic — purely an event broadcast mechanism.

### `/src/utils/`

| File | Exports |
|------|---------|
| `errors.ts` | `AppError`, `NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `ConflictError` |
| `logger.ts` | Winston logger instance (console in dev, JSON in production) |
| `response.ts` | `sendSuccess(res, data, message, status)`, `sendError(res, message, status)` |

### `/src/server.ts`
Entry point. Creates the HTTP server, passes it to `websocketService.initialize()`, starts listening, and registers `SIGTERM`/`SIGINT` handlers for graceful shutdown.

### `/tests/`

| File | What It Tests |
|------|--------------|
| `unit/card.service.test.ts` | Optimistic locking conflict, version match, create/update/delete, authorization |
| `unit/comment.service.test.ts` | 2-level threading enforcement, ownership checks, CRUD |
| `integration/board.test.ts` | Board creation flow, pagination response shape, auth enforcement |
| `integration/card-move.test.ts` | Cross-column move, within-column reorder, no duplicate positions, auth |
| `integration/comment.test.ts` | Threaded replies, max depth rejection, edit/delete ownership, cascade delete |

### `/docs/`

| File | Content |
|------|---------|
| `API_REFERENCE.md` | Every endpoint: method, path, request body, validation rules, success/error responses, WebSocket events |
| `ARCHITECTURE_GUIDE.md` | Real-time architecture, optimistic locking timeline, card reordering strategy, comment threading, scalability paths |
| `DEVELOPMENT_GUIDE.md` | Prerequisites, setup steps, adding features, database management, debugging |
| `TECHNICAL_DOCUMENTATION.md` | ERD, schema details, indexing strategy, transaction management, error hierarchy, test pyramid |

---

## Module Pattern

Every domain module follows this consistent structure:

```
module/
├── [module].routes.ts       # Route definitions + middleware
├── [module].controller.ts   # HTTP layer (thin — no business logic)
├── [module].service.ts      # Business logic (thick — all rules here)
├── [module].repository.ts   # Database layer (Prisma only)
└── [module].validator.ts    # Zod schemas + TypeScript types
```

### Import Rules

- Controllers import: service, validator, response utils
- Services import: repositories, error classes, websocket service, validator types
- Repositories import: Prisma client, Prisma types
- Routes import: controller, auth middleware

---

## Stage 2 Key Additions Per Module

### `card` module
- `card.service.ts` — optimistic locking check (`version` field), `moveCard()` method with transaction coordination, WebSocket event emission on all mutations
- `card.repository.ts` — `reorderWithinColumn()` and `moveToColumn()` using Prisma transactions, `getMaxPosition()`, paginated `findByColumnId()`
- `card.validator.ts` — `moveCardSchema` (targetColumnId, targetPosition), `version` field added to `updateCardSchema`
- `card.routes.ts` — `POST /:id/move` endpoint added

### `comment` module
- `comment.service.ts` — 2-level nesting enforcement, `updateComment()` and `deleteComment()` with ownership checks, WebSocket events on all mutations
- `comment.repository.ts` — threaded fetch (top-level only with nested replies included), `update()` and `delete()` methods
- `comment.validator.ts` — `parentId` added to `createCommentSchema`, `updateCommentSchema` added
- `comment.routes.ts` — `PATCH /:id` and `DELETE /:id` endpoints added

### `server.ts`
- WebSocket server initialized alongside HTTP server
- `websocketService.initialize(httpServer)` called before `listen()`

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case` | `auth.middleware.ts` |
| Classes | `PascalCase` | `CardService` |
| Functions/methods | `camelCase` | `createCard` |
| Constants | `UPPER_SNAKE_CASE` | `WS_EVENTS` |
| Types/Interfaces | `PascalCase` | `CreateCardInput` |
| WebSocket events | `domain:action` | `card:created` |

---

## Available Scripts

```bash
npm run dev              # Development server with hot reload (ts-node-dev)
npm run build            # Compile TypeScript → dist/
npm start                # Run compiled production build
npm test                 # Run all tests (unit + integration)
npm run test:coverage    # Tests with coverage report
npm run lint             # ESLint check
npm run format           # Prettier format
npm run prisma:migrate   # Run database migrations
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:studio    # Open Prisma Studio GUI
```
