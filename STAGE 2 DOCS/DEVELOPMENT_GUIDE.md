# Development Guide

Complete guide for setting up and developing the Collaborative Knowledge Board API.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Database Management](#database-management)
5. [Testing](#testing)
6. [Code Quality](#code-quality)
7. [Debugging](#debugging)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14.x or higher
- **Git** 2.x or higher

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - REST Client
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **TablePlus** for database management

### Knowledge Requirements
- TypeScript fundamentals
- Node.js and Express.js
- RESTful API design
- PostgreSQL and SQL basics
- Git version control

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd collaborative-knowledge-board-api
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Express.js and middleware
- Prisma ORM
- TypeScript and type definitions
- Testing frameworks
- Development tools

### 3. Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# Authentication
JWT_SECRET="your-secret-key-minimum-32-characters-long-for-security"
JWT_EXPIRES_IN="7d"

# Security
BCRYPT_ROUNDS=10
```

**Important:**
- Use a strong, unique `JWT_SECRET` (minimum 32 characters)
- Never commit `.env` to version control
- Use different secrets for development and production

### 4. Database Setup

#### Create Database

```bash
# Using psql
createdb collaborative_board_dev

# Or using SQL
psql -U postgres
CREATE DATABASE collaborative_board_dev;
```

#### Run Migrations

```bash
npm run prisma:migrate
```

This creates all database tables and relationships.

#### Generate Prisma Client

```bash
npm run prisma:generate
```

This generates TypeScript types for database models.

### 5. Verify Setup

Start the development server:

```bash
npm run dev
```

You should see:
```
🚀 Server running in development mode on port 3000
📍 Health check: http://localhost:3000/health
📍 API base: http://localhost:3000/api
✅ WebSocket server initialized
```

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-09T10:00:00.000Z"
}
```

---

## Development Workflow

### Starting Development Server

```bash
npm run dev
```

Features:
- Hot reload on file changes
- TypeScript compilation
- Automatic restart on errors
- Console logging enabled

### Project Structure

```
src/
├── config/              # Configuration
│   ├── database.ts      # Prisma client instance
│   └── env.ts           # Environment validation
├── middleware/          # Express middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── notFound.middleware.ts
├── modules/             # Feature modules
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.validator.ts
│   │   └── auth.routes.ts
│   ├── board/
│   ├── card/
│   ├── column/
│   ├── comment/
│   └── tag/
├── services/            # Shared services
│   └── websocket.service.ts
├── utils/               # Utilities
│   ├── errors.ts
│   ├── logger.ts
│   └── response.ts
├── app.ts               # Express app
└── server.ts            # Entry point
```

### Module Structure

Each feature module follows this pattern:

```
module/
├── module.controller.ts  # HTTP request handling
├── module.service.ts     # Business logic
├── module.repository.ts  # Data access
├── module.validator.ts   # Input validation
└── module.routes.ts      # Route definitions
```

### Adding a New Feature

1. **Create module folder:**
```bash
mkdir src/modules/feature
```

2. **Create files:**
```bash
touch src/modules/feature/feature.controller.ts
touch src/modules/feature/feature.service.ts
touch src/modules/feature/feature.repository.ts
touch src/modules/feature/feature.validator.ts
touch src/modules/feature/feature.routes.ts
```

3. **Implement layers:**
   - Repository: Database operations
   - Service: Business logic
   - Controller: Request handling
   - Validator: Input schemas
   - Routes: Endpoint definitions

4. **Register routes in `app.ts`:**
```typescript
import featureRoutes from './modules/feature/feature.routes';
app.use('/api/features', featureRoutes);
```

---

## Database Management

### Prisma Commands

#### View Database in Browser
```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555`

#### Create Migration
```bash
npm run prisma:migrate -- --name migration_name
```

#### Reset Database
```bash
npx prisma migrate reset
```

**Warning:** This deletes all data!

#### Seed Database
```bash
npx prisma db seed
```

### Schema Changes

1. **Edit `prisma/schema.prisma`:**
```prisma
model NewModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

2. **Create migration:**
```bash
npm run prisma:migrate -- --name add_new_model
```

3. **Generate client:**
```bash
npm run prisma:generate
```

### Database Queries

#### Using Prisma Client

```typescript
import prisma from '../config/database';

// Create
const user = await prisma.user.create({
  data: { email, password, name }
});

// Find
const users = await prisma.user.findMany({
  where: { email: { contains: '@example.com' } },
  include: { boards: true }
});

// Update
const updated = await prisma.user.update({
  where: { id },
  data: { name: 'New Name' }
});

// Delete
await prisma.user.delete({
  where: { id }
});
```

#### Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} });
  const board = await tx.board.create({ data: { userId: user.id, ... } });
  return { user, board };
});
```

---

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test tests/unit/card.service.test.ts
```

### Writing Tests

#### Unit Test Example

```typescript
import { CardService } from '../../src/modules/card/card.service';

jest.mock('../../src/modules/card/card.repository');

describe('CardService', () => {
  let service: CardService;
  
  beforeEach(() => {
    service = new CardService();
  });
  
  it('should create a card', async () => {
    const input = { columnId: '1', title: 'Test' };
    const result = await service.createCard('user-1', input);
    
    expect(result).toHaveProperty('id');
    expect(result.title).toBe('Test');
  });
});
```

#### Integration Test Example

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('POST /api/cards', () => {
  it('should create a card', async () => {
    const response = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        columnId: 'uuid',
        title: 'Test Card'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Test Card');
  });
});
```

### Test Database

Use a separate test database:

```env
# .env.test
DATABASE_URL="postgresql://username:password@localhost:5432/test_db"
```

---

## Code Quality

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format -- --check
```

### Type Checking

```bash
# Build project (checks types)
npm run build
```

### Pre-commit Checks

Recommended: Install Husky for pre-commit hooks

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm test"
```

---

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Logging

Use the Winston logger:

```typescript
import { logger } from '../utils/logger';

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message', { error });
logger.debug('Debug message');
```

### Database Query Logging

Enable in development:

```typescript
// src/config/database.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## Common Tasks

### Adding a New Endpoint

1. **Define validator:**
```typescript
// module.validator.ts
export const createSchema = z.object({
  name: z.string().min(1).max(100)
});
```

2. **Add repository method:**
```typescript
// module.repository.ts
async create(name: string) {
  return prisma.model.create({ data: { name } });
}
```

3. **Add service method:**
```typescript
// module.service.ts
async create(userId: string, input: CreateInput) {
  // Business logic
  return this.repository.create(input.name);
}
```

4. **Add controller method:**
```typescript
// module.controller.ts
create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createSchema.parse(req.body);
    const result = await this.service.create(req.userId!, input);
    sendSuccess(res, result, 'Created successfully', 201);
  } catch (error) {
    next(error);
  }
};
```

5. **Add route:**
```typescript
// module.routes.ts
router.post('/', authenticate, controller.create);
```

### Adding WebSocket Event

```typescript
// In service method
import { websocketService, WS_EVENTS } from '../../services/websocket.service';

// After database operation
websocketService.emitToBoardMembers(
  boardId,
  WS_EVENTS.CARD_CREATED,
  { card, boardId, columnId }
);
```

### Adding Database Index

```prisma
// prisma/schema.prisma
model Card {
  // ... fields
  
  @@index([columnId, position])
}
```

Then run:
```bash
npm run prisma:migrate -- --name add_card_index
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

1. Check PostgreSQL is running:
```bash
pg_isready
```

2. Verify DATABASE_URL in `.env`

3. Test connection:
```bash
psql $DATABASE_URL
```

### Prisma Client Out of Sync

```bash
npm run prisma:generate
```

### TypeScript Errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Test Failures

1. Check test database is set up
2. Run migrations on test database
3. Clear Jest cache:
```bash
npx jest --clearCache
```

### WebSocket Connection Issues

1. Verify JWT token is valid
2. Check CORS configuration
3. Ensure WebSocket port is accessible

---

## Best Practices

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive variable names
- Add comments for complex logic

### Error Handling

- Use custom error classes
- Always use try-catch in async functions
- Pass errors to error middleware
- Log errors with context

### Security

- Never commit secrets
- Validate all inputs
- Use parameterized queries (Prisma)
- Implement rate limiting
- Keep dependencies updated

### Performance

- Use database indexes
- Implement pagination
- Avoid N+1 queries
- Use transactions for multiple operations
- Cache frequently accessed data

### Testing

- Write tests for new features
- Test error scenarios
- Use meaningful test names
- Keep tests isolated
- Mock external dependencies

---

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Socket.io Documentation](https://socket.io/docs/v4/)

---

For API usage, see [API Reference](./API_REFERENCE.md).  
For architecture details, see [Technical Documentation](./TECHNICAL_DOCUMENTATION.md).
