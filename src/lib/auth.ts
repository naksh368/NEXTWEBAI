import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/** Current signed-in customer for server components (request-cached).
 *  Syncs the Clerk user into our Customer table on first access. */
export const getCurrentCustomer = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  const mobile = clerkUser.phoneNumbers[0]?.phoneNumber ?? null;
  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  // Upsert: keep our Customer row in sync with Clerk
  const customer = await db.customer.upsert({
    where: { clerkId: userId },
    update: { email, mobile, fullName: fullName ?? undefined, isVerified: true },
    create: { clerkId: userId, email, mobile, fullName, isVerified: true },
    select: { id: true, mobile: true, email: true, fullName: true, isVerified: true, createdAt: true },
  });

  return customer;
});
