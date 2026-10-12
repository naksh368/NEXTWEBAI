import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — prevents exhausting DB connections during dev HMR.
 * This is the single entry point for all data access (Phase 1: centralized).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Accept the database URL under any of the names hosts provide (manual
// DATABASE_URL, Railway, Vercel Postgres' POSTGRES_* variables, or Netlify DB's
// NETLIFY_DATABASE_URL), so the app connects without hand-setting a name.
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
