import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction 
    ? { rejectUnauthorized: true }   // Production: Strict SSL
    : { rejectUnauthorized: false }  // Development: SSL without verification
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  errorFormat: 'minimal',
});

export default prisma;
