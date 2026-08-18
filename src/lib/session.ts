import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/** Get the internal Customer.id for the currently signed-in Clerk user.
 *  Upserts the customer row on first call so the DB stays in sync. */
export async function getSessionCustomerId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  const mobile = clerkUser.phoneNumbers[0]?.phoneNumber ?? null;
  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const customer = await db.customer.upsert({
    where: { clerkId: userId },
    update: { email, mobile, fullName: fullName ?? undefined, isVerified: true },
    create: { clerkId: userId, email, mobile, fullName, isVerified: true },
    select: { id: true },
  });

  return customer.id;
}
