# System Architecture Documentation

## Overview

The Collaborative Knowledge Board API is built using a **layered architecture pattern** that emphasizes separation of concerns, testability, and maintainability.

## Architecture Layers

### 1. Routes Layer
**Responsibility:** HTTP endpoint definitions

**Location:** `src/modules/*/*.routes.ts`

**Purpose:**
- Define HTTP methods and paths
- Apply middleware (authentication, validation)
- Map endpoints to controller methods

**Example:**
```typescript
router.post('/', authenticate, boardController.create);
router.get('/', authenticate, boardController.getAll);
```

### 2. Controller Layer
**Responsibility:** Request/response handling

**Location:** `src/modules/*/*.controller.ts`

**Purpose:**
- Parse and validate request data using Zod
- Call service layer methods
- Format responses using standardized response utilities
- Handle HTTP-specific concerns (status codes, headers)

**Key Principle:** Controllers should be thin. No business logic here.

**Example:**
```typescript
create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createBoardSchema.parse(req.body);
    const board = await this.boardService.createBoard(req.userId!, input);
    sendSuccess(res, board, 'Board created successfully', 201);
  } catch (error) {
    next(error);
  }
};
```

### 3. Service Layer
**Responsibility:** Business logic and orchestration

**Location:** `src/modules/*/*.service.ts`

**Purpose:**
- Implement business rules
- Coordinate between multiple repositories
- Handle authorization checks
- Transform data for business needs
- Throw domain-specific errors

**Example:**
```typescript
async createBoard(userId: string, input: CreateBoardInput) {
  // Business logic: user can create board
  return this.boardRepository.create(userId, input.title, input.description);
}

async deleteBoard(boardId: string, userId: string) {
  const board = await this.boardRepository.findById(boardId);
  
  if (!board) {
    throw new NotFoundError('Board not found');
  }
  
  // Authorization: only owner can delete
  if (board.userId !== userId) {
    throw new ForbiddenError('Access denied');
  }
  
  await this.boardRepository.delete(boardId);
}
```

### 4. Repository Layer
**Responsibility:** Database operations

**Location:** `src/modules/*/*.repository.ts`

**Purpose:**
- Execute database queries using Prisma
- Abstract database implementation details
- Provide clean data access interface
- Handle query optimization (includes, ordering)

**Example:**
```typescript
async findByUserId(userId: string): Promise<Board[]> {
  return prisma.board.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      columns: {
        orderBy: { position: 'asc' },
      },
    },
  });
}
```

## Request Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Express Router                           │
│                  (Route Definition)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Authentication Middleware                      │
│           (Verify JWT, Extract User ID)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Controller                              │
│         • Parse request body                                │
│         • Validate with Zod schema                          │
│         • Call service method                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Service                                │
│         • Execute business logic                            │
│         • Check authorization                               │
│         • Call repository methods                           │
│         • Throw domain errors if needed                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Repository                               │
│         • Build Prisma query                                │
│         • Execute database operation                        │
│         • Return data                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Response (Success or Error)                    │
│         • Standardized JSON format                          │
│         • Appropriate HTTP status code                      │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Error Thrown (anywhere in the stack)
    ↓
Express Error Middleware
    ↓
Is it a ZodError? → Format validation errors
    ↓
Is it an AppError? → Use error's status code and message
    ↓
Unknown error? → Return 500 Internal Server Error
    ↓
Send standardized error response
```

## Module Structure

Each domain module follows this structure:

```
src/modules/[domain]/
├── [domain].controller.ts    # HTTP layer
├── [domain].service.ts        # Business logic
├── [domain].repository.ts     # Data access
├── [domain].validator.ts      # Zod schemas
└── [domain].routes.ts         # Route definitions
```

**Benefits:**
- **Cohesion:** Related code stays together
- **Discoverability:** Easy to find all code for a feature
- **Scalability:** Add new modules without affecting existing ones
- **Testability:** Each layer can be tested independently

## Cross-Cutting Concerns

### Authentication
- Implemented as Express middleware
- Validates JWT tokens
- Extracts user ID and attaches to request
- Applied at route level

### Validation
- Zod schemas defined in validator files
- Validation happens in controllers
- Type-safe input/output
- Clear error messages

### Error Handling
- Custom error classes extend base Error
- Global error handler middleware
- Consistent error response format
- Development vs production error details

### Logging
- Centralized logger utility
- Structured log format with timestamps
- Different log levels (info, warn, error, debug)
- Environment-aware (verbose in dev, minimal in prod)

## Data Flow Patterns

### Create Operation
```
Controller validates input
    ↓
Service checks business rules
    ↓
Repository creates record
    ↓
Return created entity
```

### Read Operation
```
Controller extracts parameters
    ↓
Service verifies access rights
    ↓
Repository fetches data
    ↓
Return data
```

### Update Operation
```
Controller validates input
    ↓
Service fetches existing record
    ↓
Service checks ownership
    ↓
Repository updates record
    ↓
Return updated entity
```

### Delete Operation
```
Controller extracts ID
    ↓
Service fetches existing record
    ↓
Service checks ownership
    ↓
Repository deletes record
    ↓
Return success
```

## Security Architecture

### Authentication Flow
```
User registers → Password hashed with bcrypt → Stored in database
User logs in → Password compared → JWT issued
Protected request → JWT verified → User ID extracted → Request processed
```

### Authorization Pattern
```
Request arrives with JWT
    ↓
Middleware verifies token and extracts userId
    ↓
Service fetches resource
    ↓
Service checks if resource.userId === requestUserId
    ↓
If yes: proceed
If no: throw ForbiddenError
```

## Database Architecture

### Connection Management
- Single Prisma Client instance
- Connection pooling handled by Prisma
- Graceful disconnect on shutdown

### Query Optimization
- Indexes on foreign keys
- Indexes on frequently queried fields
- Strategic use of `include` for related data
- Ordering at database level

### Transaction Handling
- Prisma handles transactions automatically
- Cascade deletes configured in schema
- Referential integrity enforced

## Scalability Considerations

### Horizontal Scaling
- Stateless authentication (JWT)
- No server-side sessions
- Database connection pooling
- Can run multiple instances behind load balancer

### Performance
- Database indexes for fast queries
- Minimal data transfer (select only needed fields)
- Efficient relationship loading
- Rate limiting to prevent abuse

### Maintainability
- Clear separation of concerns
- Consistent patterns across modules
- Type safety throughout
- Self-documenting code structure

## Design Principles Applied

1. **Single Responsibility Principle**
   - Each layer has one job
   - Each class has one reason to change

2. **Dependency Inversion**
   - High-level modules don't depend on low-level modules
   - Both depend on abstractions (interfaces)

3. **Open/Closed Principle**
   - Open for extension (add new modules)
   - Closed for modification (existing code unchanged)

4. **DRY (Don't Repeat Yourself)**
   - Shared utilities for common operations
   - Reusable error classes
   - Consistent response formatting

5. **KISS (Keep It Simple, Stupid)**
   - No over-engineering
   - Clear, readable code
   - Straightforward patterns

## Technology Choices

| Technology | Reason |
|------------|--------|
| TypeScript | Type safety, better tooling, catches errors early |
| Express | Mature, flexible, large ecosystem |
| Prisma | Type-safe queries, excellent DX, migration management |
| PostgreSQL | Relational data, ACID compliance, performance |
| Zod | Runtime validation, type inference, composable |
| JWT | Stateless, scalable, standard |
| bcrypt | Industry standard for password hashing |

## Future Enhancements

Potential improvements while maintaining architecture:

1. **Caching Layer** - Add Redis for frequently accessed data
2. **Event System** - Emit events for audit logging
3. **Background Jobs** - Queue system for async tasks
4. **API Versioning** - Support multiple API versions
5. **GraphQL** - Alternative to REST while keeping service layer
6. **Microservices** - Split modules into separate services
7. **Testing** - Unit tests for each layer, integration tests

All enhancements can be added without breaking the layered architecture.
