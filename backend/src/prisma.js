const { PrismaClient } = require('@prisma/client');

// Single shared instance — prevents DB connection pool exhaustion.
// All route and middleware files must require this instead of calling new PrismaClient().
const prisma = new PrismaClient();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
