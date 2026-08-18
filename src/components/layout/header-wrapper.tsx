import { getCurrentCustomer } from "@/lib/auth";
import { Header } from "./header";

export async function HeaderWrapper() {
  const customer = await getCurrentCustomer();
  return <Header isSignedIn={!!customer} />;
}
