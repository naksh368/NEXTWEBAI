"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePackageMetaAction, updateVersionAction } from "@/app/admin/(panel)/packages/actions";

type Dest = { id: string; name: string };
type Data = Record<string, unknown>;

const lines = (v: unknown) => (Array.isArray(v) ? (v as string[]).join("\n") : "");
const splitLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
const inp = "h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-sm focus:border-brand-blue focus:outline-none";
const ta = "min-h-[80px] w-full rounded-lg border border-surface-border bg-white p-3 text-sm focus:border-brand-blue focus:outline-none";

export function PackageEditor({ pkg, version, destinations }: { pkg: Data; version: Data; destinations: Dest[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const f = formRef.current!;
    const g = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value ?? "";
    const gb = (n: string) => (f.elements.namedItem(n) as HTMLInputElement)?.checked ?? false;
    const gn = (n: string) => parseInt(g(n) || "0", 10) || 0;

    const meta = { name: g("name"), code: g("code") || null, destinationId: g("destinationId"), theme: g("theme") || null, isFeatured: gb("isFeatured"), enquiryOnly: gb("enquiryOnly"), status: g("status") };
    const ver = {
      name: g("name"), summary: g("summary") || null, overview: g("overview") || null,
      durationNights: gn("durationNights"), basePrice: gn("basePrice"),
      pricingStatus: g("pricingStatus"), availabilityStatus: g("availabilityStatus"),
      category: g("category") || null, bestFor: g("bestFor") || null, travelWindows: g("travelWindows") || null,
      roomCategory: g("roomCategory") || null, mealPlan: g("mealPlan") || null, flightSector: g("flightSector") || null,
      baggage: g("baggage") || null, visaInfo: g("visaInfo") || null, insuranceInfo: g("insuranceInfo") || null,
      seoTitle: g("seoTitle") || null, seoDescription: g("seoDescription") || null,
      departureCities: splitLines(g("departureCities")), highlights: splitLines(g("highlights")),
      inclusions: splitLines(g("inclusions")), exclusions: splitLines(g("exclusions")),
      cancellationPolicy: g("cancellationPolicy") || null, importantInfo: g("importantInfo") || null,
      minTravellers: gn("minTravellers"), maxTravellers: gn("maxTravellers"),
      allowHotelChange: gb("allowHotelChange"), allowFlightChange: gb("allowFlightChange"), allowTransferChange: gb("allowTransferChange"),
      allowMealChange: gb("allowMealChange"), allowActivityChange: gb("allowActivityChange"), allowAddons: gb("allowAddons"), allowDateChange: gb("allowDateChange"),
    };

    setError(null); setSaved(false);
    start(async () => {
      const r1 = await updatePackageMetaAction(pkg.id as string, meta);
      if (!r1.ok) { setError(r1.error); return; }
      const r2 = await updateVersionAction(version.id as string, ver);
      if (!r2.ok) { setError(r2.error); return; }
      setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form ref={formRef} onSubmit={save} className="space-y-6">
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-bold text-brand-navy">Package settings</legend>
        <Field label="Name"><input name="name" defaultValue={pkg.name as string} className={inp} /></Field>
        <Field label="Package code"><input name="code" defaultValue={(pkg.code as string) ?? ""} className={inp} placeholder="ETX-…" /></Field>
        <Field label="Destination">
          <select name="destinationId" defaultValue={pkg.destinationId as string} className={inp}>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Theme"><input name="theme" defaultValue={(pkg.theme as string) ?? ""} className={inp} placeholder="HONEYMOON / FAMILY / LUXURY…" /></Field>
        <Field label="Status">
          <select name="status" defaultValue={pkg.status as string} className={inp}>
            {["DRAFT", "IN_REVIEW", "PUBLISHED", "PAUSED", "ARCHIVED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium"><input type="checkbox" name="isFeatured" defaultChecked={!!pkg.isFeatured} className="h-4 w-4 accent-brand-blue" /> Featured on homepage</label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium sm:col-span-2"><input type="checkbox" name="enquiryOnly" defaultChecked={!!pkg.enquiryOnly} className="h-4 w-4 accent-brand-blue" /> Enquiry only — show &ldquo;Enquire&rdquo; instead of &ldquo;Book now&rdquo; (no online payment)</label>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-bold text-brand-navy">Content</legend>
        <Field label="Short summary" wide><input name="summary" defaultValue={(version.summary as string) ?? ""} className={inp} /></Field>
        <Field label="Overview" wide><textarea name="overview" defaultValue={(version.overview as string) ?? ""} className={ta} /></Field>
        <Field label="Highlights (one per line)"><textarea name="highlights" defaultValue={lines(version.highlights)} className={ta} /></Field>
        <Field label="Departure cities (one per line)"><textarea name="departureCities" defaultValue={lines(version.departureCities)} className={ta} /></Field>
        <Field label="Inclusions (one per line)"><textarea name="inclusions" defaultValue={lines(version.inclusions)} className={ta} /></Field>
        <Field label="Exclusions (one per line)"><textarea name="exclusions" defaultValue={lines(version.exclusions)} className={ta} /></Field>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-bold text-brand-navy">Pricing & availability</legend>
        <Field label="Nights"><input name="durationNights" type="number" defaultValue={version.durationNights as number} className={inp} /></Field>
        <Field label="Base price ₹ / person"><input name="basePrice" type="number" defaultValue={version.basePrice as number} className={inp} /></Field>
        <Field label="Pricing status">
          <select name="pricingStatus" defaultValue={version.pricingStatus as string} className={inp}>
            <option value="PRICED">PRICED</option><option value="PRICE_REVIEW_REQUIRED">PRICE_REVIEW_REQUIRED</option>
          </select>
        </Field>
        <Field label="Availability">
          <select name="availabilityStatus" defaultValue={version.availabilityStatus as string} className={inp}>
            {["AVAILABLE", "LIMITED", "ON_REQUEST", "UNAVAILABLE"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Min travellers"><input name="minTravellers" type="number" defaultValue={version.minTravellers as number} className={inp} /></Field>
        <Field label="Max travellers"><input name="maxTravellers" type="number" defaultValue={version.maxTravellers as number} className={inp} /></Field>
        <Field label="Category"><input name="category" defaultValue={(version.category as string) ?? ""} className={inp} /></Field>
        <Field label="Recommended for"><input name="bestFor" defaultValue={(version.bestFor as string) ?? ""} className={inp} /></Field>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-bold text-brand-navy">Details</legend>
        <Field label="Travel window"><input name="travelWindows" defaultValue={(version.travelWindows as string) ?? ""} className={inp} /></Field>
        <Field label="Flight sector"><input name="flightSector" defaultValue={(version.flightSector as string) ?? ""} className={inp} /></Field>
        <Field label="Room category"><input name="roomCategory" defaultValue={(version.roomCategory as string) ?? ""} className={inp} /></Field>
        <Field label="Meal plan"><input name="mealPlan" defaultValue={(version.mealPlan as string) ?? ""} className={inp} /></Field>
        <Field label="Baggage"><input name="baggage" defaultValue={(version.baggage as string) ?? ""} className={inp} /></Field>
        <Field label="Visa info"><input name="visaInfo" defaultValue={(version.visaInfo as string) ?? ""} className={inp} /></Field>
        <Field label="Insurance"><input name="insuranceInfo" defaultValue={(version.insuranceInfo as string) ?? ""} className={inp} /></Field>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-bold text-brand-navy">Policies & SEO</legend>
        <Field label="Cancellation policy" wide><textarea name="cancellationPolicy" defaultValue={(version.cancellationPolicy as string) ?? ""} className={ta} /></Field>
        <Field label="Important terms" wide><textarea name="importantInfo" defaultValue={(version.importantInfo as string) ?? ""} className={ta} /></Field>
        <Field label="SEO title"><input name="seoTitle" defaultValue={(version.seoTitle as string) ?? ""} className={inp} /></Field>
        <Field label="SEO description"><input name="seoDescription" defaultValue={(version.seoDescription as string) ?? ""} className={inp} /></Field>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-brand-navy">Customer can change</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {[["allowHotelChange", "Hotel"], ["allowFlightChange", "Flight"], ["allowTransferChange", "Transfer"], ["allowMealChange", "Meals"], ["allowActivityChange", "Activities"], ["allowAddons", "Add-ons"], ["allowDateChange", "Dates"]].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 font-medium"><input type="checkbox" name={k} defaultChecked={!!version[k]} className="h-4 w-4 accent-brand-blue" /> {l}</label>
          ))}
        </div>
      </fieldset>

      {error && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>Save changes</Button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-semibold text-success"><Check className="h-4 w-4" /> Saved</span>}
      </div>
    </form>
  );
}
