# System Architecture

## Overview

The Collaborative Knowledge Board API is built on a strict 4-layer architecture that enforces separation of concerns, enables independent testing of each layer, and makes the codebase easy to extend without breaking existing functionality.

The system was developed in two stages. Stage 1 established the core layered structure with authentication, CRUD operations, and production infrastructure. Stage 2 extended that foundation with real-time WebSocket collaboration, optimistic locking, atomic card reordering, threaded comments, and performance optimizations — all without restructuring the existing architecture.

---

## Architecture Layers

```
┌──────────────────────────────────────────────────────────┐
│                    Client Layer                           │
│              (HTTP Requests + WebSocket)                  │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   Routes Layer                            │
│   src/modules/{domain}/{domain}.routes.ts                 │
│   — Endpoint definitions                                  │
│   — Middleware application (authenticate, validate)       │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                 Controllers Layer                         │
│   src/modules/{domain}/{domain}.controller.ts             │
│   — Parse and validate request input (Zod)                │
│   — Call service methods                                  │
│   — Format and send responses                             │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                  Services Layer                           │
│   src/modules/{domain}/{domain}.service.ts                │
│   — Business logic and rules                              │
│   — Authorization and ownership checks                    │
│   — WebSocket event emission                              │
│   — Coordination between repositories                     │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                Repositories Layer                         │
│   src/modules/{domain}/{domain}.repository.ts             │
│   — Prisma database queries                               │
│   — Transaction management                               │
│   — Query optimization (includes, ordering, pagination)   │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                  PostgreSQL Database                      │
└──────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Routes Layer** — Defines HTTP methods and paths, applies middleware (authentication, rate limiting), and maps endpoints to controller methods. No logic lives here.

**Controllers Layer** — Parses request data, runs Zod schema validation, calls the appropriate service method, and returns a standardized response. Controllers are intentionally thin — no business logic.

**Services Layer** — The core of the application. Implements business rules, verifies resource ownership, coordinates between multiple repositories, and emits WebSocket events after successful mutations.

**Repositories Layer** — Handles all database interaction via Prisma. Responsible for query construction, eager loading of relations, pagination, and transaction management. No business logic.

---

## Module Structure

Every domain module follows the same file structure:

```
src/modules/{domain}/
├── {domain}.routes.ts       # Route definitions
├── {domain}.controller.ts   # HTTP handling
├── {domain}.service.ts      # Business logic
├── {domain}.repository.ts   # Data access
└── {domain}.validator.ts    # Zod schemas
```

Modules: `auth`, `board`, `column`, `card`, `comment`, `tag`

---

## Request Lifecycle

```
Incoming HTTP Request
        │
        ▼
Express Router (routes.ts)
        │
        ▼
authenticate middleware  ← Verifies JWT, attaches userId to request
        │
        ▼
Controller (controller.ts)
  ├── Parse request body / params / query
  ├── Validate with Zod schema
  └── Call service method
        │
        ▼
Service (service.ts)
  ├── Fetch resource from repository
  ├── Verify ownership (resource.userId === req.userId)
  ├── Apply business rules
  ├── Call repository to persist changes
  └── Emit WebSocket event (on mutations)
        │
        ▼
Repository (repository.ts)
  ├── Build Prisma query
  ├── Execute with includes / transactions
  └── Return result
        │
        ▼
PostgreSQL
        │
        ▼
Response (standardized JSON)
```

---

## Design Patterns

### Repository Pattern

Abstracts all database access behind a clean interface. Services never import Prisma directly — they call repository methods. This makes services fully testable with mocked repositories.

```typescript
class CardRepository {
  async findById(id: string) {
    return prisma.card.findUnique({ where: { id }, include: { tags: true } });
  }
}

class CardService {
  constructor(private cardRepository: CardRepository) {}

  async getCard(id: string) {
    return this.cardRepository.findById(id);
  }
}
```

### Middleware Pattern

Cross-cutting concerns (authentication, error handling, 404 handling) are implemented as Express middleware and applied globally or at the route level.

```typescript
// Applied per route
router.patch('/:id', authenticate, cardController.update);

// Applied globally
app.use(errorHandler);
```

### Observer Pattern (WebSocket)

Services emit events after successful mutations. The WebSocket service broadcasts those events to all clients in the relevant board room. Producers and consumers are fully decoupled.

```typescript
// In CardService
const card = await this.cardRepository.create(...);
websocketService.emitToBoardMembers(boardId, WS_EVENTS.CARD_CREATED, { card, boardId });
```

---

## Stage 1: Foundation Architecture

### Authentication Flow

```
POST /api/auth/register
  → Validate input (Zod)
  → Hash password (bcrypt, 10 rounds)
  → Store user in database
  → Return JWT

POST /api/auth/login
  → Validate input
  → Fetch user by email
  → Compare password (bcrypt.compare)
  → Return JWT

Protected Request
  → Extract Bearer token from Authorization header
  → Verify JWT signature and expiration
  → Attach userId to request object
  → Continue to controller
```

### Resource Ownership Model

```
User
 └── Board (1:N)
      └── Column (1:N)
           └── Card (1:N)
                ├── Comment (1:N)
                └── Tag (N:M via CardTag)
```

Authorization is always checked at the board level. A user owns a board; all nested resources (columns, cards, comments) inherit that ownership. Checks happen in the service layer, not the controller.

### Error Handling Architecture

```
Error thrown anywhere in the stack
        │
        ▼
next(error) passed to Express error middleware
        │
        ├── ZodError → 422 Unprocessable Entity with field-level details
        ├── AppError → Use error's statusCode and message
        └── Unknown  → 500 Internal Server Error
```

Custom error classes:
- `AppError` — Base class with `statusCode`
- `NotFoundError` — 404
- `ForbiddenError` — 403
- `UnauthorizedError` — 401
- `ConflictError` — 409

---

## Stage 2: Collaboration Architecture

### Real-Time WebSocket Architecture

```
HTTP Layer (REST)
  — Handles CRUD operations
  — Returns immediate HTTP response
  — Emits WebSocket event after mutation
        │
        ▼
WebSocket Service (src/services/websocket.service.ts)
  — Manages Socket.io server
  — Authenticates connections via JWT
  — Maintains board rooms and user socket maps
  — Broadcasts events to board rooms
        │
        ▼
Connected Clients
  — Receive real-time updates
  — Update UI without polling
```

**Key decisions:**
- Socket.io chosen for automatic reconnection, room support, and fallback mechanisms
- JWT authentication on WebSocket handshake (same token as HTTP)
- One room per board (`board:{boardId}`) — events are isolated per board
- WebSocket service has no business logic — it only broadcasts
- Events emitted from the service layer, after the database write succeeds

#### WebSocket Event Flow

```
User A creates a card
        │
        ▼
Controller validates input
        │
        ▼
CardService creates card in database
        │
        ├── Returns card to User A via HTTP response
        │
        └── Calls websocketService.emitToBoardMembers(boardId, 'card:created', { card })
                │
                ▼
        Socket.io broadcasts to board:{boardId} room
                │
                ├── User B receives card:created event
                ├── User C receives card:created event
                └── User D receives card:created event
```

### Optimistic Locking

Version-based conflict detection prevents lost updates when multiple users edit the same card concurrently.

```
Time    User A                    User B
────────────────────────────────────────────
T1      Read card (version: 1)    Read card (version: 1)
T2      Edit title                Edit description
T3      PATCH /cards/:id          
        { title: "X", version: 1 }
        → Success, version now 2
T4                                PATCH /cards/:id
                                  { description: "Y", version: 1 }
                                  → 409 Conflict
T5                                Re-fetch card (version: 2)
T6                                PATCH /cards/:id
                                  { description: "Y", version: 2 }
                                  → Success, version now 3
```

Implementation:
```typescript
if (input.version !== undefined && card.version !== input.version) {
  throw new ConflictError('Card has been modified by another user. Please refresh and try again.');
}
// Update and increment version atomically
await this.cardRepository.update(cardId, { ...input, version: { increment: 1 } });
```

### Card Reordering Architecture

Integer-based positions with automatic adjustment, wrapped in a database transaction.

**Within same column — move card from position 0 to position 2:**
```
Before: [Card A(0), Card B(1), Card C(2), Card D(3)]
Move Card A to position 2:
  1. Shift cards at positions 1–2 down by 1
  2. Place Card A at position 2
After:  [Card B(0), Card C(1), Card A(2), Card D(3)]
```

**Across columns:**
```
Column A: [Card1(0), Card2(1), Card3(2)]
Column B: [Card4(0), Card5(1)]

Move Card2 from Column A to Column B at position 1:
  1. Shift Column A: fill gap left by Card2
     → [Card1(0), Card3(1)]
  2. Shift Column B: make space at position 1
     → [Card4(0), Card5(2)]
  3. Move Card2 to Column B position 1
     → [Card4(0), Card2(1), Card5(2)]
```

All three steps execute inside a single Prisma transaction — atomic, consistent, and safe under concurrent load.

### Threaded Comment Architecture

Two-level nesting using a self-referential database relationship.

```
Comment (parentId: null)
 ├── Reply (parentId: comment.id)
 ├── Reply (parentId: comment.id)
 └── Reply (parentId: comment.id)
```

Database design:
```prisma
model Comment {
  parentId String?
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[] @relation("CommentReplies")
  @@index([parentId])
}
```

Query strategy — fetch top-level comments with replies in a single query:
```typescript
prisma.comment.findMany({
  where: { cardId, parentId: null },
  include: {
    replies: { include: { user: true }, orderBy: { createdAt: 'asc' } },
    user: true
  },
  orderBy: { createdAt: 'desc' }
});
```

The 2-level limit is enforced at the service layer: if a `parentId` is provided, the service verifies the parent has no `parentId` of its own before allowing the reply.

---

## Security Architecture

```
Layer 1: Network       — Rate limiting (100 req/15 min), CORS
Layer 2: Transport     — Helmet security headers
Layer 3: Authentication — JWT verification on every protected request
Layer 4: Authorization  — Ownership checks in service layer
Layer 5: Validation    — Zod schema validation on all inputs
Layer 6: Database      — Prisma parameterized queries (SQL injection prevention)
```

---

## Performance Architecture

### Database Indexing

| Index | Query Pattern |
|-------|--------------|
| `users.email` | Authentication lookup |
| `boards.userId` | List user's boards |
| `columns.boardId` | List board's columns |
| `cards.columnId` | List column's cards |
| `cards.(columnId, position)` | Ordered card queries |
| `comments.cardId` | List card's comments |
| `comments.parentId` | Fetch comment replies |
| `tags.name` | Tag lookup by name |

### N+1 Query Prevention

All repositories use Prisma `include` to fetch related data in a single query. No loops with individual database calls exist anywhere in the codebase.

### Pagination

High-volume endpoints return paginated results with metadata:
```json
{
  "data": {
    "items": [...],
    "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
  }
}
```

---

## Scalability Considerations

The current architecture is production-ready for a single-server deployment. The following paths exist for scaling:

**Horizontal scaling** — JWT is stateless, so multiple server instances can run behind a load balancer. The only constraint is WebSocket state (user-socket map is in-memory). Adding Redis pub/sub would enable multi-server WebSocket broadcasting.

**Database scaling** — Read replicas can be added for query-heavy workloads. Prisma supports connection pooling configuration.

**Caching** — Tag lists and board metadata are good candidates for Redis caching, as they change infrequently but are read often.

---

## Technology Decisions

| Technology | Reason |
|-----------|--------|
| TypeScript | Type safety, compile-time error detection, better tooling |
| Express.js | Mature, minimal, large ecosystem |
| Prisma ORM | Type-safe queries, migration management, N+1 prevention |
| PostgreSQL | ACID compliance, relational integrity, strong indexing |
| Zod | Runtime validation with TypeScript type inference |
| JWT | Stateless, scalable, no server-side session storage |
| Socket.io | Automatic reconnection, room support, fallback mechanisms |
| bcrypt | Industry standard for password hashing |

---

For API details, see [API Reference](./docs/API_REFERENCE.md).
For setup instructions, see [Development Guide](./docs/DEVELOPMENT_GUIDE.md).
For technical specifications, see [Technical Documentation](./docs/TECHNICAL_DOCUMENTATION.md).
