import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma as a true singleton.
 *
 * On Vercel every warm invocation reuses the same Node process, so a new
 * PrismaClient per request would leak connections until Supavisor refuses them.
 * We cache the client on globalThis (survives module re-evaluation in dev
 * HMR and warm lambda reuse) and never call $connect eagerly: Prisma connects
 * lazily on first query, which keeps cold starts cheap.
 *
 * DATABASE_URL points at the transaction pooler (6543) with connection_limit=1
 * so each function instance holds at most one server connection.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["warn", "error"],
  });

if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

@Injectable()
export class PrismaService implements OnModuleInit {
  readonly db = prisma;

  async onModuleInit(): Promise<void> {
    // Intentionally not connecting here: lazy connect keeps cold starts fast.
  }
}
