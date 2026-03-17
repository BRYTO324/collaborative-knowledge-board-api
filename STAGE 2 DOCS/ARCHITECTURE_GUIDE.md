# Architecture Guide

## System Design and Implementation Decisions

This document explains the architectural decisions, design patterns, and implementation strategies used in the Collaborative Knowledge Board API. It covers both the Stage 1 foundation and the Stage 2 enhancements that built on top of it.

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Design Patterns](#design-patterns)
3. [Stage 1: Foundation Architecture](#stage-1-foundation-architecture)
4. [Stage 2: Collaboration Architecture](#stage-2-collaboration-architecture)
5. [Key Design Decisions](#key-design-decisions)
6. [Scalability Considerations](#scalability-considerations)
7. [Security Architecture](#security-architecture)

---

## Architectural Overview

### Layered Architecture

The application follows a strict 4-layer architecture. Each layer has a single, well-defined responsibility and communicates only with the layer directly below it.

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Routes + Controllers)               │
│  — HTTP request/response handling       │
│  — Input validation (Zod)               │
│  — Response formatting                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Business Logic Layer            │
│           (Services)                    │
│  — Authorization and ownership checks   │
│  — Business rules enforcement           │
│  — Workflow orchestration               │
│  — WebSocket event emission             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Data Access Layer               │
│        (Repositories)                   │
│  — Prisma database queries              │
│  — Transaction management               │
│  — Query optimization                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Database Layer                  │
│        (PostgreSQL)                     │
└─────────────────────────────────────────┘
```

### Benefits

- **Separation of Concerns** — Each layer has one job and one reason to change
- **Testability** — Layers can be tested independently with mocked dependencies
- **Maintainability** — Changes in one layer don't ripple through others
- **Scalability** — Individual layers can be optimized or replaced without restructuring
- **Consistency** — All 6 modules follow the same patterns, making the codebase predictable

---

## Design Patterns

### Repository Pattern

All database access is abstracted behind repository classes. Services never import Prisma directly — they call repository methods. This decouples business logic from the database implementation and makes unit testing straightforward.

```typescript
// Repository handles all database operations
class CardRepository {
  async findById(id: string) {
    return prisma.card.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } }, comments: true }
    });
  }
}

// Service uses repository — no Prisma knowledge here
class CardService {
  constructor(private cardRepository: CardRepository) {}

  async getCard(id: string) {
    const card = await this.cardRepository.findById(id);
    if (!card) throw new NotFoundError('Card not found');
    return card;
  }
}
```

### Dependency Injection

Services receive their dependencies through the constructor. This makes dependencies explicit and enables easy substitution with mocks in tests.

```typescript
class CardService {
  constructor(
    private cardRepository: CardRepository,
    private columnRepository: ColumnRepository,
    private boardRepository: BoardRepository
  ) {}
}
```

### Middleware Pattern

Cross-cutting concerns are implemented as Express middleware and applied at the appropriate scope — globally for error handling, per-route for authentication.

```typescript
// Per-route authentication
router.patch('/:id', authenticate, cardController.update);

// Global error handling
app.use(errorHandler);
```

### Observer Pattern (WebSocket)

Services emit events after successful database mutations. The WebSocket service broadcasts those events to connected clients. Producers (services) and consumers (clients) are fully decoupled — adding a new event type requires no changes to the WebSocket service.

```typescript
// Service emits after successful operation
const card = await this.cardRepository.create(...);
websocketService.emitToBoardMembers(boardId, WS_EVENTS.CARD_CREATED, { card, boardId });

// Client observes
socket.on('card:created', (data) => { /* update UI */ });
```

---

## Stage 1: Foundation Architecture

### Authentication Flow

```
Client                          Server
  │                               │
  │── POST /api/auth/register ───>│
  │                               │ Validate input (Zod)
  │                               │ Hash password (bcrypt)
  │                               │ Store user
  │<── { user, token } ──────────│
  │                               │
  │── POST /api/auth/login ──────>│
  │                               │ Fetch user by email
  │                               │ Compare password (bcrypt)
  │                               │ Generate JWT
  │<── { user, token } ──────────│
  │                               │
  │── GET /api/boards ───────────>│
  │   Authorization: Bearer JWT   │ Verify JWT
  │                               │ Extract userId
  │                               │ Fetch boards
  │<── { boards } ───────────────│
```

**Key decisions:**
- JWT for stateless, scalable authentication — no server-side sessions
- Bcrypt with 10 rounds — strong enough for security, fast enough for UX
- 7-day token expiration — balances security and convenience

### Resource Ownership Model

```
User
 └── Board (1:N)
      └── Column (1:N)
           └── Card (1:N)
                ├── Comment (1:N)
                └── Tag (N:M via CardTag)
```

Authorization is always resolved at the board level. A user owns a board; all nested resources inherit that ownership. The service layer fetches the board and checks `board.userId === requestUserId` before allowing any mutation.

### Error Handling Architecture

```
Error thrown in service or repository
        │
        ▼
next(error) in controller catch block
        │
        ▼
Global error middleware (src/middleware/error.middleware.ts)
        │
        ├── ZodError    → 422 with field-level validation details
        ├── AppError    → Use error.statusCode and error.message
        └── Unknown     → 500 Internal Server Error
```

Custom error hierarchy:
```typescript
AppError (base)
 ├── NotFoundError    (404)
 ├── ForbiddenError   (403)
 ├── UnauthorizedError (401)
 └── ConflictError    (409)
```

---

## Stage 2: Collaboration Architecture

### Real-Time Architecture

Stage 2 added a WebSocket layer that runs alongside the HTTP server. The two layers are independent — HTTP handles CRUD and returns immediate responses; the WebSocket layer broadcasts events to connected clients after mutations succeed.

```
┌─────────────────────────────────────────┐
│         HTTP Layer (REST)               │
│  — CRUD operations                      │
│  — Returns immediate HTTP response      │
│  — Emits WebSocket event on mutation    │
└──────────────┬──────────────────────────┘
               │ emitToBoardMembers()
               ▼
┌─────────────────────────────────────────┐
│      WebSocket Service                  │
│  — Manages Socket.io server             │
│  — Authenticates connections (JWT)      │
│  — Maintains board rooms                │
│  — Broadcasts events                    │
└──────────────┬──────────────────────────┘
               │ socket.io broadcast
               ▼
┌─────────────────────────────────────────┐
│         Connected Clients               │
│  — Receive real-time updates            │
│  — No polling required                  │
└─────────────────────────────────────────┘
```

**Key decisions:**
- Socket.io for automatic reconnection, room support, and fallback mechanisms
- JWT authentication on WebSocket handshake — same token as HTTP
- One room per board (`board:{boardId}`) — events are scoped to the relevant board
- WebSocket service has zero business logic — it only broadcasts
- Events emitted from the service layer, after the database write succeeds

#### Event Flow

```
User A creates a card
        │
        ▼
Controller validates input
        │
        ▼
CardService creates card in database
        │
        ├── Returns HTTP 201 to User A
        │
        └── websocketService.emitToBoardMembers(boardId, 'card:created', { card })
                │
                ▼
        Socket.io broadcasts to board:{boardId}
                │
                ├── User B receives card:created
                ├── User C receives card:created
                └── User D receives card:created
```

### Optimistic Locking Architecture

Version-based conflict detection prevents lost updates when multiple users edit the same card concurrently. No database-level locks are required.

```
Time    User A                      User B
────────────────────────────────────────────────
T1      Read card (version: 1)      Read card (version: 1)
T2      Edit title                  Edit description
T3      PATCH { title, version: 1 }
        → Success, version → 2
T4                                  PATCH { description, version: 1 }
                                    → 409 Conflict
T5                                  Re-fetch card (version: 2)
T6                                  PATCH { description, version: 2 }
                                    → Success, version → 3
```

Implementation:
```typescript
async updateCard(cardId: string, userId: string, input: UpdateCardInput) {
  const card = await this.cardRepository.findById(cardId);

  if (input.version !== undefined && card.version !== input.version) {
    throw new ConflictError(
      'Card has been modified by another user. Please refresh and try again.'
    );
  }

  return this.cardRepository.update(cardId, {
    ...input,
    version: { increment: 1 }
  });
}
```

**Why version over timestamp?**
- Timestamps can have clock synchronization issues across servers
- Integer versions are deterministic and monotonically increasing
- Easier to reason about and test

### Card Reordering Architecture

Integer-based positions with automatic adjustment, wrapped in a Prisma transaction for atomicity.

**Within same column:**
```
Before: [A(0), B(1), C(2), D(3)]
Move A to position 2:
  1. Shift B and C down: B(0), C(1)
  2. Place A at position 2
After:  [B(0), C(1), A(2), D(3)]
```

**Across columns:**
```
Column A: [Card1(0), Card2(1), Card3(2)]
Column B: [Card4(0), Card5(1)]

Move Card2 from A to B at position 1:
  1. Fill gap in Column A → [Card1(0), Card3(1)]
  2. Make space in Column B → [Card4(0), Card5(2)]
  3. Move Card2 to Column B position 1 → [Card4(0), Card2(1), Card5(2)]
```

All three steps execute inside a single Prisma transaction — if any step fails, all changes are rolled back.

**Why integer positions?**
- Simple and predictable
- Easy to query with `ORDER BY position`
- Automatic adjustment keeps positions contiguous (no gaps)

### Comment Threading Architecture

Two-level nesting using a self-referential Prisma relationship.

```
Comment (parentId: null)          ← top-level
 ├── Reply (parentId: comment.id) ← level 1
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

Fetch strategy — top-level comments with replies in a single query:
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

The 2-level limit is enforced in the service layer: before creating a reply, the service checks that the parent comment has `parentId: null`. If the parent is itself a reply, the request is rejected with a `403 Forbidden`.

---

## Key Design Decisions

### Why PostgreSQL?
ACID compliance ensures data integrity for concurrent operations (card reordering, optimistic locking). Strong relational model with foreign keys and cascade deletes. Excellent performance with proper indexing.

### Why Prisma ORM?
Type-safe queries with automatic TypeScript type generation. Migration management built in. Prevents SQL injection via parameterized queries. Excellent developer experience with Prisma Studio.

### Why JWT for Authentication?
Stateless — no server-side session storage required. Scales horizontally without shared session state. Self-contained — includes user identity. Industry standard with broad library support.

### Why Socket.io for WebSocket?
Automatic reconnection on network interruption. Built-in room support for board-level event isolation. Fallback to long-polling for environments that block WebSocket. Built-in authentication middleware support.

### Why Version-Based Optimistic Locking?
No database locks means no lock contention under concurrent load. Deterministic — integer versions are more reliable than timestamps. Clear, actionable error message for the client. Scales well with many concurrent users.

### Why Zod for Validation?
Runtime type checking that TypeScript alone cannot provide. Automatic TypeScript type inference from schemas — no duplication. Composable schemas that can be reused across validators. Clear, structured error messages for API consumers.

---

## Scalability Considerations

### Current Architecture

The current implementation is production-ready for single-server deployment. Key scalability characteristics:

- **Stateless HTTP** — JWT authentication requires no shared session state; multiple instances can run behind a load balancer
- **WebSocket state** — The user-socket map is in-memory; this is the primary constraint for horizontal scaling
- **Database** — Prisma manages connection pooling; the database is the natural scaling bottleneck

### Scaling Paths

**Horizontal WebSocket scaling:**
```
Load Balancer (sticky sessions for WebSocket)
    │
    ├── Server 1 ──┐
    ├── Server 2 ──┼── Redis Pub/Sub ── PostgreSQL
    └── Server 3 ──┘
```
Add Redis pub/sub so WebSocket events are broadcast across all server instances.

**Database read scaling:**
```
Application Servers
    │
    ├── Read Replica 1  (queries)
    ├── Read Replica 2  (queries)
    └── Primary         (writes)
```

**Caching:**
Tag lists and board metadata change infrequently but are read often — good candidates for Redis caching with invalidation on write.

---

## Security Architecture

```
Layer 1: Network       — Rate limiting (100 req/15 min per IP), CORS
Layer 2: Transport     — Helmet security headers (X-Frame-Options, CSP, etc.)
Layer 3: Authentication — JWT verification on every protected request
Layer 4: Authorization  — Ownership checks in service layer
Layer 5: Validation    — Zod schema validation on all inputs
Layer 6: Database      — Prisma parameterized queries (SQL injection prevention)
```

**Defense in depth** — each layer independently rejects invalid or unauthorized requests. A failure in one layer does not expose the system.

---

For API endpoint details, see [API Reference](./API_REFERENCE.md).
For technical specifications, see [Technical Documentation](./TECHNICAL_DOCUMENTATION.md).
For setup instructions, see [Development Guide](./DEVELOPMENT_GUIDE.md).
