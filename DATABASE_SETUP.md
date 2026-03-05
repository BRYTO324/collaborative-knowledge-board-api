# Database Setup Guide

Complete guide for setting up and managing the PostgreSQL database for the Collaborative Knowledge Board API.

## Prerequisites

- PostgreSQL 14 or higher installed
- Database user with CREATE DATABASE privileges

## Quick Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE knowledge_board;

# Create user (optional, if not using existing user)
CREATE USER kb_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE knowledge_board TO kb_user;

# Exit psql
\q
```

### 2. Configure Connection

Update `.env` file:
```env
DATABASE_URL="postgresql://kb_user:your_secure_password@localhost:5432/knowledge_board?schema=public"
```

### 3. Run Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

## Database Schema

### Tables Created

1. **users**
   - id (UUID, PK)
   - email (String, Unique)
   - password (String, Hashed)
   - name (String)
   - createdAt (DateTime)
   - updatedAt (DateTime)

2. **boards**
   - id (UUID, PK)
   - title (String)
   - description (String, Optional)
   - userId (UUID, FK → users.id)
   - createdAt (DateTime)
   - updatedAt (DateTime)

3. **columns**
   - id (UUID, PK)
   - title (String)
   - position (Integer)
   - boardId (UUID, FK → boards.id)
   - createdAt (DateTime)
   - updatedAt (DateTime)

4. **cards**
   - id (UUID, PK)
   - title (String)
   - description (String, Optional)
   - dueDate (DateTime, Optional)
   - position (Integer)
   - columnId (UUID, FK → columns.id)
   - createdAt (DateTime)
   - updatedAt (DateTime)

5. **tags**
   - id (UUID, PK)
   - name (String, Unique)
   - color (String)
   - createdAt (DateTime)

6. **card_tags** (Junction Table)
   - cardId (UUID, FK → cards.id)
   - tagId (UUID, FK → tags.id)
   - Composite PK: (cardId, tagId)

7. **comments**
   - id (UUID, PK)
   - content (String)
   - cardId (UUID, FK → cards.id)
   - userId (UUID, FK → users.id)
   - createdAt (DateTime)
   - updatedAt (DateTime)

### Indexes

- users.email
- boards.userId
- columns.boardId
- cards.columnId
- comments.cardId
- comments.userId
- tags.name

### Cascade Rules

- Delete User → Cascade delete Boards
- Delete Board → Cascade delete Columns
- Delete Column → Cascade delete Cards
- Delete Card → Cascade delete Comments
- Delete Card → Cascade delete CardTags
- Delete User (who commented) → Set Comment.userId to NULL

## Prisma Commands

### Generate Client
```bash
npm run prisma:generate
```
Generates TypeScript types and Prisma Client based on schema.

### Create Migration
```bash
npm run prisma:migrate
```
Creates a new migration and applies it to the database.

### Apply Migrations
```bash
npx prisma migrate deploy
```
Applies pending migrations (production use).

### Reset Database
```bash
npx prisma migrate reset
```
⚠️ WARNING: Drops database, recreates it, and applies all migrations.

### Open Prisma Studio
```bash
npm run prisma:studio
```
Opens a GUI to view and edit database data at http://localhost:5555

### View Migration Status
```bash
npx prisma migrate status
```
Shows which migrations have been applied.

## Connection Troubleshooting

### Error: "Can't reach database server"

**Possible causes:**
1. PostgreSQL is not running
2. Wrong host/port in DATABASE_URL
3. Firewall blocking connection

**Solutions:**
```bash
# Check if PostgreSQL is running (Linux/Mac)
sudo systemctl status postgresql

# Start PostgreSQL (Linux/Mac)
sudo systemctl start postgresql

# Check if PostgreSQL is running (Windows)
# Open Services and look for PostgreSQL service
```

### Error: "Authentication failed"

**Possible causes:**
1. Wrong username/password
2. User doesn't have access to database

**Solutions:**
```bash
# Connect as postgres user
psql -U postgres

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE knowledge_board TO kb_user;
```

### Error: "Database does not exist"

**Solution:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE knowledge_board;"
```

## Production Setup

### 1. Use Connection Pooling

Update DATABASE_URL:
```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"
```

### 2. Use SSL Connection

For production databases (e.g., AWS RDS, Heroku):
```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&sslmode=require"
```

### 3. Apply Migrations

```bash
# Don't use migrate dev in production
# Use migrate deploy instead
npx prisma migrate deploy
```

### 4. Backup Strategy

```bash
# Backup database
pg_dump -U kb_user knowledge_board > backup.sql

# Restore database
psql -U kb_user knowledge_board < backup.sql
```

## Environment-Specific Databases

### Development
```env
DATABASE_URL="postgresql://localhost:5432/knowledge_board_dev"
```

### Testing
```env
DATABASE_URL="postgresql://localhost:5432/knowledge_board_test"
```

### Production
```env
DATABASE_URL="postgresql://production-host:5432/knowledge_board_prod?sslmode=require"
```

## Seeding Data (Optional)

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  // Create test board
  const board = await prisma.board.create({
    data: {
      title: 'Sample Board',
      description: 'A sample board for testing',
      userId: user.id,
    },
  });

  // Create columns
  await prisma.column.createMany({
    data: [
      { title: 'To Do', position: 0, boardId: board.id },
      { title: 'In Progress', position: 1, boardId: board.id },
      { title: 'Done', position: 2, boardId: board.id },
    ],
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

## Database Monitoring

### Check Connection Count
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'knowledge_board';
```

### View Active Queries
```sql
SELECT pid, usename, application_name, state, query 
FROM pg_stat_activity 
WHERE datname = 'knowledge_board';
```

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Tips

1. **Use Indexes**: Already configured in schema for foreign keys
2. **Connection Pooling**: Prisma handles this automatically
3. **Query Optimization**: Use `select` to fetch only needed fields
4. **Batch Operations**: Use `createMany`, `updateMany` for bulk operations
5. **Transactions**: Use `prisma.$transaction()` for atomic operations

## Security Best Practices

1. **Never commit .env**: Already in .gitignore
2. **Use strong passwords**: For database users
3. **Limit privileges**: Grant only necessary permissions
4. **Use SSL in production**: Add `sslmode=require` to DATABASE_URL
5. **Regular backups**: Automate database backups
6. **Monitor access**: Review pg_stat_activity regularly

## Common Issues

### Migration Conflicts

If migrations are out of sync:
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Or resolve manually
npx prisma migrate resolve --applied "migration_name"
```

### Schema Drift

If schema doesn't match database:
```bash
# Pull current database schema
npx prisma db pull

# Push schema to database (development only)
npx prisma db push
```

## Support

For database issues:
- Check Prisma logs in console
- Review migration files in `prisma/migrations/`
- Use Prisma Studio to inspect data
- Check PostgreSQL logs

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
