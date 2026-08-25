import { db } from "@/lib/db";

/**
 * Audit log writer (Phase 31). Every sensitive admin mutation — booking changes,
 * package/price edits, refunds, review moderation, settings — records who did
 * what, to which resource, with before/after state.
 */
export async function writeAudit(input: {
  adminUserId: string;
  action: string;
  resource: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorType: "ADMIN",
        adminUserId: input.adminUserId,
        action: input.action,
        resource: input.resource,
        before: (input.before ?? null) as never,
        after: (input.after ?? null) as never,
      },
    });
  } catch {
    // Never let audit failure break the primary action; surface via app logs.
    console.error("audit write failed", input.action, input.resource);
  }
}
