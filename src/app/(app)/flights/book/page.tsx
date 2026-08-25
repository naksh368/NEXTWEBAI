import { BookingWizard, type BookingContext } from "@/components/app/booking-wizard";
import { airportByCode } from "@/data/airports";

export const metadata = { title: "Book Flight" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const ctx: BookingContext = {
    from: sp.from ?? "DEL",
    to: sp.to ?? "DXB",
    airline: sp.airline ?? "Air India",
    flightNo: sp.flightNo ?? "AI 000",
    dep: sp.dep ?? "09:40",
    arr: sp.arr ?? "12:20",
    date: sp.date ?? "2026-09-18",
    base: Number(sp.base ?? 15200),
    tax: Number(sp.tax ?? 3300),
    total: Number(sp.total ?? 18500),
    pax: Number(sp.pax ?? 1),
    brand: sp.brand ?? "SAVER",
  };
  // Resolve city names for clarity in the header.
  airportByCode(ctx.from);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Complete Your Booking</h1>
        <p className="mt-1 text-ink-muted">
          Five quick steps from fare to a confirmed ticket.
        </p>
      </div>
      <BookingWizard ctx={ctx} />
    </div>
  );
}
