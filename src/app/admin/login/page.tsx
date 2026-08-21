import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";

// The separate admin login has been removed — there is ONE login page.
// Admins sign in on /sign-in with the same email/mobile + password and are
// routed to the dashboard by role.
export default async function AdminLoginRedirect() {
  if (await getCurrentAdmin()) redirect("/admin");
  redirect("/sign-in?redirect_url=/admin");
}
