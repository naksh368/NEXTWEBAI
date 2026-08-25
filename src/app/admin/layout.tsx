import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = {
  title: { default: "Admin", template: "%s · ExpertzTrip Admin" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
