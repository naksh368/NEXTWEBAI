import Link from "next/link";
import { ArrowLeft, Plane, Calendar, Users } from "lucide-react";
import { getSupplier } from "@/lib/supplier";
import { FlightResults } from "@/components/app/flight-results";
import { airportByCode } from "@/data/airports";
import type { CabinClass } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Flight Results" };

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const from = sp.from ?? "DEL";
  const to = sp.to ?? "DXB";
  const depart = sp.depart ?? "2026-09-18";
  const adults = Number(sp.adults ?? 1);
  const children = Number(sp.children ?? 0);
  const travellers = adults + children;
  const cabin = (sp.cabin as CabinClass) ?? "Economy";

  const supplier = getSupplier();
  const result = await supplier.flightSearch({
    from,
    to,
    departDate: depart,
    returnDate: sp.ret,
    adults,
    children,
    cabin,
  });

  const fromA = airportByCode(from);
  const toA = airportByCode(to);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Route header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/flights"
            className="grid h-10 w-10 place-items-center rounded-lg border border-surface-border bg-white text-navy hover:bg-surface-muted"
            aria-label="Back to search"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-extrabold text-navy">
              {fromA.city}
              <Plane size={16} className="text-blue" />
              {toA.city}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-ink-muted">
              <span className="flex items-center gap-1">
                <Calendar size={12} /> {formatDate(depart)}
                {sp.ret ? ` – ${formatDate(sp.ret)}` : ""}
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> {travellers} traveller{travellers > 1 ? "s" : ""}
              </span>
              <span>· {cabin}</span>
            </p>
          </div>
        </div>
        <Link
          href="/flights"
          className="rounded-lg border border-surface-border bg-white px-4 py-2.5 text-sm font-bold text-blue hover:bg-blue-50"
        >
          Modify Search
        </Link>
      </div>

      <FlightResults offers={result.offers} travellers={travellers} />
    </div>
  );
}
