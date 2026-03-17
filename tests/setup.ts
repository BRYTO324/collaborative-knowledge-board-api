import prisma from '../src/config/database';

// Wake up Neon serverless DB before any test runs
beforeAll(async () => {
  await prisma.$queryRaw`SELECT 1`;
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});
