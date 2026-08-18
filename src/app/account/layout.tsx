// Account pages require auth and always read live data — never statically prerender.
export const dynamic = "force-dynamic";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
