import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "./header";

export async function HeaderWrapper() {
  const customer = await getCurrentCustomer();
  let unread = 0;
  if (customer) {
    unread = await db.notification.count({ where: { customerId: customer.id, isRead: false } }).catch(() => 0);
  }
  return <Header isSignedIn={!!customer} unreadCount={unread} />;
}
