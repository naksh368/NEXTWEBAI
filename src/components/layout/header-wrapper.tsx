import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteSettings, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";
import { Header } from "./header";

export async function HeaderWrapper() {
  const [customer, s] = await Promise.all([getCurrentCustomer(), getSiteSettings()]);
  let unread = 0;
  if (customer) {
    unread = await db.notification.count({ where: { customerId: customer.id, isRead: false } }).catch(() => 0);
  }
  return (
    <Header
      isSignedIn={!!customer}
      unreadCount={unread}
      brandName={s.brandName}
      logoUrl={s.logoUrl}
      phoneDisplay={s.phonePrimary}
      telHref={telLinkFor(s)}
      whatsappHref={whatsappLinkFor(s, `Hello ${s.brandName}, I would like to plan an Andaman holiday.`)}
    />
  );
}
