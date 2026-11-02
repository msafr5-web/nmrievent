'use strict';
const { PrismaClient } = require('@prisma/client');

// One client per process. Reusing it avoids exhausting the connection pool.
const prisma = new PrismaClient();

module.exports = prisma;
