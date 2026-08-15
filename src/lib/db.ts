import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — prevents exhausting DB connections during dev HMR.
 * This is the single entry point for all data access (Phase 1: centralized).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
