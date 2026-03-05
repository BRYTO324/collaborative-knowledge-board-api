# Loom Walkthrough Script (3 Minutes)

## Introduction (15 seconds)

"Hi! I'm going to walk you through the Collaborative Knowledge Board API I built. This is a production-ready backend system demonstrating clean architecture, proper database design, and professional engineering practices. Let's dive in."

---

## Architecture Overview (45 seconds)

"First, the architecture. I chose a **4-layer architecture pattern**:

1. **Routes** - Define HTTP endpoints
2. **Controllers** - Handle requests and responses, stay thin
3. **Services** - Contain all business logic
4. **Repositories** - Handle database operations

**Why this matters**: Each layer has a single responsibility. Controllers don't know about databases. Services don't know about HTTP. This makes the code testable, maintainable, and scalable.

The request flow is: Route → Auth Middleware → Controller validates with Zod → Service executes business logic → Repository queries the database → Response sent back in a standardized format."

---

## Database Design (45 seconds)

"Let's talk database. I designed a relational schema with 6 entities:

- **User** - Authentication
- **Board** - Top-level workspace
- **Column** - Sections within a board
- **Card** - Tasks within columns
- **Tag** - Labels for cards (many-to-many)
- **Comment** - Discussions on cards

**Key relationships**:
- User owns Boards (1:N with cascade delete)
- Board contains Columns (1:N with cascade delete)
- Column contains Cards (1:N with cascade delete)
- Cards and Tags are many-to-many via a junction table
- Cards have Comments (1:N)

I added indexes on foreign keys and frequently queried fields for performance. Position fields allow drag-and-drop reordering."

---

## Code Organization (30 seconds)

"The folder structure is module-based. Each domain—auth, board, card, comment, tag—is self-contained with its own controller, service, repository, validator, and routes.

**Why?** When you need to work on boards, everything is in one folder. No hunting across the codebase. This scales beautifully as the project grows.

Shared utilities like error classes, logging, and response formatters are centralized to avoid duplication."

---

## Key Engineering Decisions (45 seconds)

"Let me highlight some critical decisions:

**1. TypeScript Strict Mode** - Catches errors at compile time, not runtime.

**2. Zod Validation** - Every input is validated with type-safe schemas. No bad data reaches the database.

**3. JWT Authentication** - Stateless, scalable, works great with microservices.

**4. Repository Pattern** - Database logic is isolated. Easy to test, easy to swap implementations.

**5. Custom Error Classes** - Type-safe errors like `NotFoundError`, `UnauthorizedError`. The global error handler converts these to proper HTTP responses.

**6. Security** - Helmet for headers, rate limiting (100 requests per 15 minutes), bcrypt for passwords, CORS configured."

---

## Closing (15 seconds)

"This API is production-ready. It has proper authentication, authorization, validation, error handling, and documentation. The architecture is clean, the code is maintainable, and it's built to scale. Thanks for watching!"

---

## Visual Aids to Show (Optional)

1. **Folder structure** - Show the organized module layout
2. **Prisma schema** - Highlight relationships
3. **Sample route file** - Show how thin controllers are
4. **Error handling** - Show custom error classes and global handler
5. **Postman/API call** - Demonstrate a working endpoint

---

## Key Talking Points to Emphasize

- **Separation of concerns** - Each layer has one job
- **Type safety** - TypeScript strict mode + Zod validation
- **Security** - JWT, bcrypt, rate limiting, Helmet
- **Scalability** - Layered architecture, stateless auth
- **Production-ready** - Error handling, logging, graceful shutdown
- **Professional standards** - No fat controllers, DRY principle, clean code

---

## Timing Breakdown

- Introduction: 15s
- Architecture: 45s
- Database: 45s
- Code Organization: 30s
- Engineering Decisions: 45s
- Closing: 15s

**Total: ~3 minutes**
