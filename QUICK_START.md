# Quick Start Guide

Get the Collaborative Knowledge Board API running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git installed

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and update these values:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/knowledge_board?schema=public"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long-change-this"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

### 4. Start Server

```bash
npm run dev
```

You should see:
```
🚀 Server running in development mode on port 3000
📍 Health check: http://localhost:3000/health
📍 API base: http://localhost:3000/api
```

### 5. Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register a User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Save the `token` from the response.

**Create a Board:**
```bash
curl -X POST http://localhost:3000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My First Board",
    "description": "Getting started"
  }'
```

## Using Postman

1. Import `postman_collection.json` into Postman
2. Run the "Register" request
3. The token will be automatically saved
4. Run other requests in order

## Common Issues

### Database Connection Error

**Error:** `Can't reach database server`

**Solution:** 
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database credentials

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
- Change PORT in `.env` to another value (e.g., 3001)
- Or kill the process using port 3000

### JWT Secret Error

**Error:** `JWT_SECRET must be at least 32 characters`

**Solution:**
- Update JWT_SECRET in `.env` with a longer string
- Use a password generator for a secure secret

## Next Steps

- Read [README.md](./README.md) for architecture details
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for all endpoints
- Open Prisma Studio to view data: `npm run prisma:studio`

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Update `DATABASE_URL` to production database
3. Generate a strong `JWT_SECRET` (32+ characters)
4. Run `npm run build`
5. Run `npm start`

## Support

For issues or questions, refer to:
- [README.md](./README.md) - Full documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [LOOM_SCRIPT.md](./LOOM_SCRIPT.md) - Video walkthrough script
