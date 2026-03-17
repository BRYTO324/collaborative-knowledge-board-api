# Architecture Evolution Document
## Collaborative Knowledge Board API — Stage 2

**Project:** Collaborative Knowledge Board API
**Version:** 2.0.0
**Stage:** 2 — Collaboration & System Thinking

---

## Overview

Stage 1 delivered a solid REST API foundation: authentication, full CRUD for boards, columns, cards, and tags, with production infrastructure (rate limiting, logging, error handling, JWT auth). The architecture was a clean 4-layer pattern — Routes → Controllers → Services → Repositories.

Stage 2 extended that foundation without restructuring it. Three major systems were added on top: real-time event broadcasting, optimistic conflict detection, and atomic card reordering. This document explains the design decisions behind each.

---

## 1. Conflict Handling — Optimistic Locking

### The Problem

In a collaborative environment, two users can read the same card at the same time, make independent edits, and submit updates. Without conflict detection, the second write silently overwrites the first — a "lost update" bug that is invisible to both users.

### The Strategy: Version-Based Optimistic Locking

Every `Card` record has a `version` field (integer, default `1`). It increments atomically on every successful update.

```prisma
model Card {
  version Int @default(1)
  ...
}
```

When a client wants to update a card, it sends the version it last read alongside the update payload:

```http
PATCH /api/cards/:id
{ "title": "New title", "version": 1 }
```

The service layer checks the submitted version against the current database value before applying any changes:

```typescript
// src/modules/card/card.service.ts
if (input.version !== undefined && card.version !== input.version) {
  throw new ConflictError(
    'Card has been modified by another user. Please refresh and try again.'
  );
}
```

If the versions match, the update proceeds and the version is incremented atomically:

```typescript
// src/modules/card/card.repository.ts
const { version: _version, ...updateData } = data;
return prisma.card.update({
  where: { id },
  data: { ...updateData, version: { increment: 1 } },
});
```

If they don't match, the server returns `409 Conflict`. The client re-fetches the latest card (now at version 2), applies their change, and retries with the new version.

### Conflict Flow

```
Time    User A                        User B
────────────────────────────────────────────────────
T1      GET /cards/:id  → version: 1  GET /cards/:id  → version: 1
T2      Edits title locally            Edits description locally
T3      PATCH { title, version: 1 }
        → 200 OK, version now: 2
T4                                    PATCH { description, version: 1 }
                                      → 409 Conflict
T5                                    GET /cards/:id  → version: 2
T6                                    PATCH { description, version: 2 }
                                      → 200 OK, version now: 3
```

### Why Optimistic (Not Pessimistic) Locking

Pessimistic locking (database row locks) blocks concurrent reads and degrades performance under load. Optimistic locking assumes conflicts are rare — it allows concurrent reads and only checks at write time. This scales well and requires no changes to the database engine configuration.

The `version` field is also incremented when a card is moved, ensuring clients always have an accurate picture of the card's state.

---

## 2. Ordering Strategy — Card Reordering

### The Problem

Cards need to maintain a stable, gap-free integer position within their column. When a card is moved, the positions of surrounding cards must be adjusted. This must be:
- Atomic — no partial updates
- Consistent — no duplicate positions
- Safe under concurrent requests

### The Strategy: Integer Positions with Transactional Shifts

Each card has a `position` integer. Moving a card shifts the affected cards by ±1 to open or close the gap. All steps execute inside a single Prisma transaction.

#### Within the Same Column

```
Before: [Card A(0), Card B(1), Card C(2), Card D(3)]

Move Card A from position 0 → position 2:
  Step 1: Shift cards at positions 1–2 down by 1
          [Card B(0), Card C(1), Card D(3)]
  Step 2: Place Card A at position 2
          [Card B(0), Card C(1), Card A(2), Card D(3)]
```

Implementation:

```typescript
// src/modules/card/card.repository.ts — reorderWithinColumn()
await prisma.$transaction(async (tx) => {
  // Shift cards between old and new position
  await tx.card.updateMany({
    where: {
      columnId,
      id: { not: targetCardId },
      position: { gt: oldPosition, lte: newPosition },
    },
    data: { position: { decrement: 1 } },
  });

  // Place the moved card at its new position
  await tx.card.update({
    where: { id: targetCardId },
    data: { position: newPosition },
  });
});
```

The moved card is always identified by its `id`, never by its position — this prevents the card from being accidentally shifted by its own position update.

#### Across Columns

```
Column 1: [A(0), B(1), C(2)]     Column 2: [D(0), E(1)]

Move B from Column 1 → Column 2 at position 1:
  Step 1: Close gap in Column 1  →  [A(0), C(1)]
  Step 2: Open space in Column 2 →  [D(0), E(2)]
  Step 3: Move B to Column 2     →  [D(0), B(1), E(2)]
```

Implementation:

```typescript
// src/modules/card/card.repository.ts — moveToColumn()
await prisma.$transaction(async (tx) => {
  // Step 1: Close gap in source column
  await tx.card.updateMany({
    where: { columnId: sourceColumnId, position: { gt: card.position } },
    data: { position: { decrement: 1 } },
  });

  // Step 2: Open space in target column
  await tx.card.updateMany({
    where: { columnId: targetColumnId, position: { gte: targetPosition } },
    data: { position: { increment: 1 } },
  });

  // Step 3: Move the card
  await tx.card.update({
    where: { id: cardId },
    data: { columnId: targetColumnId, position: targetPosition, version: { increment: 1 } },
  });
});
```

All three steps are atomic. A failure at any step rolls back the entire transaction — the database never enters a partial state.

### Handling Duplicate Positions

If a card is moved to a position already occupied by another card in the same column (e.g., due to a dirty state), the service shifts all cards at `>= targetPosition` down by 1 before placing the moved card. This guarantees no duplicates regardless of the incoming state.

### Why Integer Positions (Not Floating Point / Fractional)

Fractional indexing (e.g., inserting between 1.0 and 2.0 as 1.5) avoids shifting but degrades over time — positions become arbitrarily long decimals requiring periodic normalization. Integer positions with transactional shifts are simpler, predictable, and require no maintenance.

---

## 3. Real-Time Approach — WebSocket Architecture

### The Problem

In a collaborative board, users need to see each other's changes immediately — cards being created, moved, and commented on — without polling the server repeatedly.

### The Strategy: Socket.io with Board-Scoped Rooms

The WebSocket layer is implemented as a standalone service (`src/services/websocket.service.ts`) that sits alongside the HTTP stack. The two layers are fully decoupled — HTTP handles requests and responses, WebSocket handles broadcasting. The service layer is the only bridge between them.

```
HTTP Request → Controller → Service → Repository → Database
                                  │
                                  └── websocketService.emitToBoardMembers()
                                                │
                                         Socket.io Room
                                                │
                              ┌─────────────────┼─────────────────┐
                           User B            User C            User D
                        (receives event)  (receives event)  (receives event)
```

### Authentication

WebSocket connections are authenticated at the handshake level using the same JWT token as HTTP. Unauthenticated connections are rejected before they are established:

```typescript
// src/services/websocket.service.ts
private async authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication token required'));

  const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
  socket.data.userId = decoded.userId;
  next();
}
```

### Board Rooms

Each board has its own Socket.io room (`board:{boardId}`). Clients join a room when they open a board and leave when they navigate away. Events are broadcast only to clients in the relevant room — users on different boards never receive each other's events.

```typescript
socket.on('join:board', (boardId: string) => {
  socket.join(`board:${boardId}`);
});
```

### Event Emission

Events are emitted from the service layer, after the database write succeeds. This guarantees clients only receive events for changes that were actually persisted:

```typescript
// After successful DB write in CardService
websocketService.emitToBoardMembers(boardId, WS_EVENTS.CARD_CREATED, {
  card,
  boardId,
  columnId,
});
```

### Events

| Event | Trigger |
|-------|---------|
| `card:created` | Card created |
| `card:updated` | Card updated |
| `card:moved` | Card moved within or across columns |
| `card:deleted` | Card deleted |
| `comment:created` | Comment or reply created |
| `comment:updated` | Comment edited |
| `comment:deleted` | Comment deleted |

### Why Socket.io (Not Raw WebSocket / SSE)

| Option | Reason Not Chosen |
|--------|------------------|
| Raw `ws` | No built-in rooms, reconnection, or fallback |
| Server-Sent Events | One-directional only, no client→server events |
| Socket.io | Rooms, auto-reconnect, fallback to long-polling, widely supported |

Socket.io's room abstraction maps directly to the board-scoped event model. Auto-reconnection means clients recover from network drops without any extra code.

### Separation of Concerns

The WebSocket service has zero business logic. It does not validate ownership, check permissions, or query the database. It only broadcasts. All decisions about what to emit and when are made in the service layer. This keeps the real-time layer thin, testable, and replaceable.

---

## Summary of Architectural Decisions

| Decision | Approach | Reason |
|----------|----------|--------|
| Conflict detection | Optimistic locking (version field) | No DB locks, scales under concurrent load |
| Card ordering | Integer positions + transactional shifts | Simple, predictable, no maintenance |
| Real-time | Socket.io with board rooms | Rooms, reconnection, clean separation |
| Event emission point | Service layer, post-DB write | Guarantees events reflect persisted state |
| WebSocket auth | JWT on handshake | Same token as HTTP, no separate auth system |
| Nesting limit | Enforced in service layer | Prevents deep recursion before any DB write |

---

**Document Version:** 2.0.0
**Last Updated:** March 2026
