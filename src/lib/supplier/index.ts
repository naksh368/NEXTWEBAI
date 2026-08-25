/* ─────────────────────────────────────────────────────────────
   Supplier resolver.

   The rest of the app imports getSupplier() and never a concrete
   class. To add TBO / AirIQ / another supplier later, register it in
   the map below and route by config — no frontend change required.
   ───────────────────────────────────────────────────────────── */

import { MockSupplier } from "./mock-supplier";
import type { SupplierService } from "./types";

export type SupplierId = "mock" | "tbo" | "airiq" | "supplier1" | "supplier2";

const registry: Partial<Record<SupplierId, () => SupplierService>> = {
  mock: () => new MockSupplier(),
  // tbo: () => new TboSupplier(),      // future
  // airiq: () => new AirIqSupplier(),  // future
};

/** The active supplier for V1. Config-driven so it can change without code edits downstream. */
const ACTIVE: SupplierId = "mock";

export function getSupplier(id: SupplierId = ACTIVE): SupplierService {
  const factory = registry[id];
  if (!factory) throw new Error(`Supplier "${id}" is not connected`);
  return factory();
}

export * from "./types";
