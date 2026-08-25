// Backward-compat shim — customer session moved to customer-session.ts
export { getCustomerSessionId as getSessionCustomerId, setCustomerCookie, clearCustomerCookie } from "./customer-session";
