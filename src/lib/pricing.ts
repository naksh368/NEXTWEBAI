import { TAX_RATE } from "./constants";

/**
 * Server-authoritative pricing engine (Phase 10).
 *
 * The frontend may render an *estimate*, but the numbers that matter — checkout,
 * booking, invoices — always come from here, on the server. Pure functions so
 * they're trivially testable and safe to snapshot into a booking (Phase 11).
 *
 * All money is whole rupees (integers).
 */

export type PricingOption = {
  id: string;
  category: string;
  groupKey: string;
  label: string;
  priceDelta: number;
  perPerson: boolean;
  isDefault: boolean;
};

export type PricingDeparture = {
  id: string;
  priceDelta: number;
};

export type PricingCoupon = {
  code: string;
  kind: "PERCENT" | "FLAT";
  value: number;
  maxDiscount?: number | null;
  minAmount?: number | null;
};

export type PricingInputs = {
  currency: string;
  basePrice: number;
  perPersonPricing: boolean;
  options: PricingOption[];
  departures: PricingDeparture[];
};

export type PricingSelection = {
  travellerCount: number;
  selectedOptionIds: string[];
  departureId?: string | null;
  coupon?: PricingCoupon | null;
};

export type PriceLineItem = {
  kind: "BASE" | "OPTION" | "DEPARTURE" | "DISCOUNT" | "TAX";
  category?: string;
  label: string;
  amount: number; // signed whole rupees
};

export type PriceBreakdown = {
  currency: string;
  travellerCount: number;
  items: PriceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

const clampTravellers = (n: number) => Math.max(1, Math.min(99, Math.floor(n || 1)));

/**
 * Given all available options and a set of selected ids, return the *effective*
 * selection: for every mutually-exclusive group (hotel, flight, transfer, meal)
 * exactly one option is chosen — the customer's pick, else the group default.
 * Additive categories (activity, addon) keep only what was explicitly selected.
 */
export function resolveSelectedOptions(
  options: PricingOption[],
  selectedOptionIds: string[]
): PricingOption[] {
  const selected = new Set(selectedOptionIds);
  const groups = new Map<string, PricingOption[]>();
  for (const opt of options) {
    if (!groups.has(opt.groupKey)) groups.set(opt.groupKey, []);
    groups.get(opt.groupKey)!.push(opt);
  }

  const additiveCategories = new Set(["ACTIVITY", "ADDON"]);
  const result: PricingOption[] = [];

  for (const [, groupOpts] of groups) {
    const isAdditive = groupOpts.every((o) => additiveCategories.has(o.category));
    if (isAdditive) {
      for (const o of groupOpts) if (selected.has(o.id)) result.push(o);
    } else {
      // exclusive: chosen pick, or default, or first
      const chosen =
        groupOpts.find((o) => selected.has(o.id)) ??
        groupOpts.find((o) => o.isDefault) ??
        groupOpts[0];
      if (chosen) result.push(chosen);
    }
  }
  return result;
}

export function computePricing(
  inputs: PricingInputs,
  selection: PricingSelection,
  taxRate: number = TAX_RATE
): PriceBreakdown {
  const rate = Number.isFinite(taxRate) && taxRate >= 0 && taxRate <= 1 ? taxRate : TAX_RATE;
  const travellers = clampTravellers(selection.travellerCount);
  const items: PriceLineItem[] = [];

  // 1) Base
  const baseAmount = inputs.perPersonPricing
    ? inputs.basePrice * travellers
    : inputs.basePrice;
  items.push({
    kind: "BASE",
    label: inputs.perPersonPricing
      ? `Base package × ${travellers} traveller${travellers > 1 ? "s" : ""}`
      : "Base package",
    amount: baseAmount,
  });

  // 2) Options (only non-zero deltas surface as lines)
  const effective = resolveSelectedOptions(inputs.options, selection.selectedOptionIds);
  for (const opt of effective) {
    if (opt.priceDelta === 0) continue;
    const amount = opt.perPerson ? opt.priceDelta * travellers : opt.priceDelta;
    items.push({ kind: "OPTION", category: opt.category, label: opt.label, amount });
  }

  // 3) Departure surcharge (per person)
  if (selection.departureId) {
    const dep = inputs.departures.find((d) => d.id === selection.departureId);
    if (dep && dep.priceDelta !== 0) {
      items.push({
        kind: "DEPARTURE",
        label: "Selected departure date",
        amount: dep.priceDelta * travellers,
      });
    }
  }

  const subtotal = items.reduce((sum, it) => sum + it.amount, 0);

  // 4) Coupon discount
  let discount = 0;
  if (selection.coupon) {
    const c = selection.coupon;
    const meetsMin = !c.minAmount || subtotal >= c.minAmount;
    if (meetsMin) {
      if (c.kind === "PERCENT") {
        discount = Math.round((subtotal * Math.min(Math.max(c.value, 0), 100)) / 100);
      } else {
        discount = Math.min(c.value, subtotal);
      }
      if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    }
  }
  if (discount > 0) {
    items.push({ kind: "DISCOUNT", label: `Discount (${selection.coupon?.code})`, amount: -discount });
  }

  // 5) Tax on the discounted subtotal
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * rate);
  items.push({ kind: "TAX", label: `Taxes & fees (${Math.round(rate * 100)}%)`, amount: tax });

  const total = taxable + tax;

  return {
    currency: inputs.currency,
    travellerCount: travellers,
    items,
    subtotal,
    discount,
    tax,
    total,
  };
}

/** "Starting from" price shown on cards/listings — base for one traveller. */
export function startingPrice(basePrice: number): number {
  return basePrice;
}
