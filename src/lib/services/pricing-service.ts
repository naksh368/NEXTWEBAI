import { db } from "@/lib/db";
import {
  computePricing, resolveSelectedOptions,
  type PricingInputs, type PricingSelection, type PriceBreakdown, type PricingCoupon,
} from "@/lib/pricing";

export type RepriceRequest = {
  versionId: string;
  travellerCount: number;
  selectedOptionIds: string[];
  departureId?: string | null;
  couponCode?: string | null;
};

export type RepriceResult = {
  ok: true;
  breakdown: PriceBreakdown;
  selectedOptionIds: string[]; // resolved (defaults filled in)
  couponApplied: boolean;
  couponMessage?: string;
} | {
  ok: false;
  error: string;
};

/**
 * The single server-side entry point for pricing (Phase 10/39). Checkout and
 * booking MUST call this — never trust a price sent by the client.
 */
export async function reprice(req: RepriceRequest): Promise<RepriceResult> {
  const version = await db.packageVersion.findUnique({
    where: { id: req.versionId },
    include: {
      options: { where: { isEnabled: true } },
      departures: { where: { isEnabled: true } },
    },
  });
  if (!version || !version.isPublished) {
    return { ok: false, error: "This package is no longer available." };
  }

  const travellerCount = Math.max(
    version.minTravellers,
    Math.min(version.maxTravellers, Math.floor(req.travellerCount || 1))
  );

  const inputs: PricingInputs = {
    currency: version.currency,
    basePrice: version.basePrice,
    perPersonPricing: version.perPersonPricing,
    options: version.options.map((o) => ({
      id: o.id, category: o.category, groupKey: o.groupKey, label: o.label,
      priceDelta: o.priceDelta, perPerson: o.perPerson, isDefault: o.isDefault,
    })),
    departures: version.departures.map((d) => ({ id: d.id, priceDelta: d.priceDelta })),
  };

  const baseSelection = {
    travellerCount,
    selectedOptionIds: req.selectedOptionIds ?? [],
    departureId: req.departureId ?? null,
  };

  // Discount is resolved on the server (authoritative). Offers AUTO-APPLY —
  // when no code is given we pick the active offer that saves the customer most.
  const now = new Date();
  const isLive = (c: { isActive: boolean; startsAt: Date | null; endsAt: Date | null; usageLimit: number | null; usedCount: number }) =>
    c.isActive && (!c.startsAt || c.startsAt <= now) && (!c.endsAt || c.endsAt >= now) && (!c.usageLimit || c.usedCount < c.usageLimit);
  const toPricingCoupon = (c: { code: string; kind: string; value: number; maxDiscount: number | null; minAmount: number | null }): PricingCoupon =>
    ({ code: c.code, kind: c.kind as "PERCENT" | "FLAT", value: c.value, maxDiscount: c.maxDiscount, minAmount: c.minAmount });
  const discountFor = (c: { kind: string; value: number; maxDiscount: number | null; minAmount: number | null }, subtotal: number) => {
    if (c.minAmount && subtotal < c.minAmount) return 0;
    let d = c.kind === "PERCENT" ? Math.round((subtotal * Math.min(Math.max(c.value, 0), 100)) / 100) : Math.min(c.value, subtotal);
    if (c.maxDiscount) d = Math.min(d, c.maxDiscount);
    return d;
  };

  let coupon: PricingCoupon | null = null;
  let couponApplied = false;
  let couponMessage: string | undefined;

  if (req.couponCode) {
    const c = await db.coupon.findUnique({ where: { code: req.couponCode.toUpperCase() } });
    if (c && isLive(c)) coupon = toPricingCoupon(c);
    else couponMessage = "That offer isn't valid.";
  } else {
    // Auto-apply the best live offer.
    const subtotal = computePricing(inputs, { ...baseSelection, coupon: null }).subtotal;
    const actives = await db.coupon.findMany({ where: { isActive: true } });
    let bestDisc = 0;
    for (const c of actives) {
      if (!isLive(c)) continue;
      const d = discountFor(c, subtotal);
      if (d > bestDisc) { bestDisc = d; coupon = toPricingCoupon(c); }
    }
    if (coupon) couponMessage = "Best available offer applied automatically.";
  }

  const selection: PricingSelection = { ...baseSelection, coupon };

  const breakdown = computePricing(inputs, selection);
  const resolved = resolveSelectedOptions(inputs.options, selection.selectedOptionIds).map((o) => o.id);

  // Was a coupon actually discounting?
  couponApplied = breakdown.discount > 0;
  if (coupon && !couponApplied && !couponMessage) {
    couponMessage = coupon.minAmount ? `Add more to reach the ${coupon.code} minimum.` : "Coupon didn't apply.";
  }

  return { ok: true, breakdown, selectedOptionIds: resolved, couponApplied, couponMessage };
}
