import { cache } from "react";
import { getCustomerSessionId } from "./customer-session";
import { db } from "./db";

export const getCurrentCustomer = cache(async () => {
  const id = await getCustomerSessionId();
  if (!id) return null;
  return db.customer.findUnique({
    where: { id },
    select: { id: true, mobile: true, email: true, fullName: true, isVerified: true, createdAt: true },
  });
});
