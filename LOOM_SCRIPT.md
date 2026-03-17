# Stage 2 Loom Walkthrough Script (~3 Minutes)

---

## INTRO — 0:00 to 0:15

"Hey, I'm walking you through Stage 2 of my Collaborative Knowledge Board API.
Stage 1 gave us the core foundation — auth, boards, columns, cards, tags, clean layered architecture.
Stage 2 is where the system becomes truly collaborative. I added real-time WebSocket events,
threaded comments, atomic card reordering, optimistic locking for conflict detection, and a full
test suite. Let me show you exactly how each piece works."

---

## 1. ARCHITECTURE OVERVIEW — 0:15 to 0:40

> Show: `src/` folder structure in the file tree

"The architecture didn't change in Stage 2 — and that's intentional. The 4-layer pattern held up
perfectly: Routes, Controllers, Services, Repositories. Every new feature slotted in cleanly
without touching existing layers.

What Stage 2 added on top is a dedicated WebSocket service that sits alongside the HTTP layer.
The two are completely decoupled — HTTP handles requests and responses, WebSocket handles
broadcasting. Services are the bridge: after every successful database write, the service emits
a real-time event. That's the entire integration point."

---

## 2. REAL-TIME WEBSOCKET — 0:40 to 1:10

> Show: `src/services/websocket.service.ts`

"The WebSocket service uses Socket.io. When the HTTP server starts, it initializes Socket.io on
the same port — no separate server needed.

Authentication is handled at the handshake level. The client passes its JWT token, we verify it
the same way we verify HTTP requests, and attach the userId to the socket. Unauthenticated
connections are rejected before they even connect.

Clients join board rooms by emitting a `join:board` event with a board ID. From that point, any
mutation on that board — card created, card moved, comment added — gets broadcast to everyone
in that room instantly.

The key design decision here: the WebSocket service has zero business logic. It only broadcasts.
All logic stays in the service layer. This keeps the real-time layer clean and testable."

> Show: `WS_EVENTS` constant and `emitToBoardMembers` call in `card.service.ts`

"There are 7 events: card created, updated, moved, deleted — and comment created, updated,
deleted. Every mutation emits the relevant event after the database write succeeds."

---

## 3. THREADED COMMENTS — 1:10 to 1:35

> Show: `prisma/schema.prisma` — Comment model

"Comments use a self-referential relationship in the schema. A comment has an optional `parentId`
that points back to another comment in the same table. Prisma handles this with a named relation
called `CommentReplies`.

The cascade is set on both directions — delete a card, all its comments go. Delete a parent
comment, all its replies go automatically at the database level.

The 2-level limit is enforced in the service layer."

> Show: `comment.service.ts` — the parentId check block

"When a reply is created, we fetch the parent comment and check if it already has a `parentId`.
If it does, it's already a reply — we throw a 403 Forbidden. Simple, clean, no deep recursion
needed.

On the read side, we fetch only top-level comments and include their replies in a single query
using Prisma's `include`. No N+1 problem — one database round trip returns the full threaded
structure."

---

## 4. CARD REORDERING — 1:35 to 2:05

> Show: `src/modules/card/card.repository.ts` — `reorderWithinColumn` and `moveToColumn`

"Card positioning uses integers. Every card has a `position` field. Moving a card means shifting
the other cards to fill the gap or make room.

For within-column moves, say moving Card A from position 0 to position 2 — we shift every card
between those positions by minus one, then place Card A at position 2. All of this runs inside a
single Prisma transaction, so it's atomic. No partial updates, no duplicate positions.

For cross-column moves, it's three steps in one transaction: close the gap in the source column,
open a gap in the target column, then move the card. The card's version is also incremented on
move so clients can detect the change.

There's also a special case — if a card is moved to a position already occupied by another card
in the same column, we shift all cards at that position and above to make room. This handles
dirty state gracefully."

---

## 5. OPTIMISTIC LOCKING — 2:05 to 2:25

> Show: `src/modules/card/card.service.ts` — version check in `updateCard`

"Every card has a `version` field that starts at 1 and increments on every update.

When a frontend client wants to update a card, it can optionally send the version it last read.
If that version doesn't match what's in the database, it means another user already modified the
card — we return a 409 Conflict with a clear message: 'Card has been modified by another user.
Please refresh and try again.'

The client then re-fetches the latest version and retries. This prevents silent data loss when
two users edit the same card at the same time. If no version is sent, the check is skipped —
so it's opt-in for clients that support it."

---

## 6. TESTING — 2:25 to 2:45

> Show: `tests/` folder, then run `npx jest --no-coverage --forceExit --runInBand` in terminal

"The test suite covers 46 tests across 5 files — 2 unit test files and 3 integration test files.

Unit tests mock all dependencies and test the service layer in isolation — version conflict
detection, nesting enforcement, authorization checks, all covered.

Integration tests hit the real Express app with a real database. They test the full flow:
create board, move card across columns, verify no duplicate positions, create threaded comments,
cascade delete replies, authorization on every endpoint.

All 46 pass."

---

## CLOSING — 2:45 to 3:00

"Stage 2 took a solid Stage 1 foundation and made it collaborative — real-time events,
conflict-safe updates, atomic reordering, and threaded discussions. The architecture stayed
clean throughout. Everything is tested, documented, and production-ready. Thanks."

---

## SCREEN SEQUENCE (what to show and when)

| Time | What to show on screen |
|------|------------------------|
| 0:00–0:15 | Project folder structure in editor |
| 0:15–0:40 | `src/` folder tree, highlight the 4 layers |
| 0:40–1:10 | `websocket.service.ts` — full file, scroll through it |
| 1:10–1:35 | `schema.prisma` Comment model, then `comment.service.ts` parentId check |
| 1:35–2:05 | `card.repository.ts` — `reorderWithinColumn` and `moveToColumn` |
| 2:05–2:25 | `card.service.ts` — version conflict check block |
| 2:25–2:45 | Terminal: run `npx jest --no-coverage --forceExit --runInBand`, show all green |
| 2:45–3:00 | `API_DOCUMENTATION.md` or Postman — show a card move request live |

---

## KEY PHRASES TO HIT

- "HTTP and WebSocket are fully decoupled — services are the bridge"
- "One Prisma transaction — atomic, no duplicate positions"
- "409 Conflict — the client re-fetches and retries"
- "Two-level limit enforced in the service layer, cascade enforced at the database level"
- "46 tests, all green"
