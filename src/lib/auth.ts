import { cache } from "react";
import { db } from "./db";
import { getSessionCustomerId } from "./session";

/** Current signed-in customer for server components (request-cached). */
export const getCurrentCustomer = cache(async () => {
  const id = await getSessionCustomerId();
  if (!id) return null;
  return db.customer.findUnique({
    where: { id },
    select: { id: true, mobile: true, email: true, fullName: true, isVerified: true, createdAt: true },
  });
});
