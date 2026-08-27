import { Header } from "./header";

/**
 * The public marketing header is a pure B2B acquisition bar (Register / Partner
 * Login) and carries no per-customer state, so it renders statically.
 */
export function HeaderWrapper() {
  return <Header />;
}
