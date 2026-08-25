"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plane,
  Luggage,
  Briefcase,
  Check,
  X,
  ChevronDown,
  BadgeIndianRupee,
} from "lucide-react";
import type { FlightOffer, FareOption } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { inr, formatDuration, cn } from "@/lib/utils";

function airlineInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function FlightCard({
  offer,
  travellers,
}: {
  offer: FlightOffer;
  travellers: number;
}) {
  const [open, setOpen] = useState(false);
  const cheapest = offer.fares[0];
  const airline = offer.segments[0].airline;

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-white shadow-card transition-shadow hover:shadow-cardHover">
      {/* Summary row */}
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          {/* Airline */}
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-sm font-extrabold text-blue">
              {airlineInitials(airline.name)}
            </span>
            <div className="sm:hidden">
              <p className="text-sm font-bold text-navy">{airline.name}</p>
              <p className="text-xs text-ink-faint">{offer.segments[0].flightNumber}</p>
            </div>
          </div>

          {/* Times */}
          <div className="flex items-center justify-between gap-3">
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-navy">{airline.name}</p>
              <p className="text-xs text-ink-faint">{offer.segments[0].flightNumber}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-navy">{offer.departTime}</p>
              <p className="text-xs font-bold text-ink-faint">{offer.from.code}</p>
            </div>
            <div className="flex-1 px-2 text-center">
              <p className="text-xs font-semibold text-ink-muted">
                {formatDuration(offer.totalDurationMins)}
              </p>
              <div className="relative my-1.5 flex items-center">
                <span className="h-px flex-1 bg-surface-border" />
                <Plane size={13} className="mx-1 text-blue" />
                <span className="h-px flex-1 bg-surface-border" />
              </div>
              <p className="text-[0.7rem] font-bold uppercase text-ink-faint">
                {offer.stops === 0 ? "Non-stop" : `${offer.stops} stop`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-navy">{offer.arriveTime}</p>
              <p className="text-xs font-bold text-ink-faint">{offer.to.code}</p>
            </div>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-4 border-t border-surface-border pt-4 lg:min-w-[190px] lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="lg:text-right">
            <p className="text-xs text-ink-faint">from</p>
            <p className="text-xl font-extrabold text-navy">{inr(cheapest.total)}</p>
            <p className="text-[0.7rem] font-bold text-orange">
              Earn {inr(cheapest.agentEarning)}
            </p>
          </div>
          <Button
            variant={open ? "outline" : "primary"}
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0"
          >
            View Fare
            <ChevronDown
              size={15}
              className={cn("transition-transform", open && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {/* Quick facts */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-surface-border bg-surface-muted px-5 py-2.5 text-xs font-semibold text-ink-muted">
        <span className="flex items-center gap-1.5">
          <Luggage size={13} /> Cabin {cheapest.conditions.cabinBaggage}
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase size={13} /> Check-in {cheapest.conditions.checkInBaggage}
        </span>
        <span className="flex items-center gap-1.5">
          {cheapest.conditions.refundable ? (
            <Badge tone="success">Refundable</Badge>
          ) : (
            <Badge tone="neutral">Non-refundable</Badge>
          )}
        </span>
        <span className="ml-auto text-ink-faint">{offer.cabin}</span>
      </div>

      {/* Fare options */}
      {open && (
        <div className="animate-fade-in-fast border-t border-surface-border p-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
            <BadgeIndianRupee size={14} className="text-blue" /> Choose a fare · price for{" "}
            {travellers} traveller{travellers > 1 ? "s" : ""}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {offer.fares.map((fare) => (
              <FareTile
                key={fare.id}
                fare={fare}
                offer={offer}
                travellers={travellers}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FareTile({
  fare,
  offer,
  travellers,
}: {
  fare: FareOption;
  offer: FlightOffer;
  travellers: number;
}) {
  const total = fare.total * travellers;
  const brandTone =
    fare.brand === "CORPORATE" ? "orange" : fare.brand === "FLEXI" ? "blue" : "neutral";
  const params = new URLSearchParams({
    offer: offer.id,
    fare: fare.id,
    from: offer.from.code,
    to: offer.to.code,
    airline: offer.segments[0].airline.name,
    flightNo: offer.segments[0].flightNumber,
    dep: offer.departTime,
    arr: offer.arriveTime,
    date: offer.segments[0].departDate,
    base: String(fare.baseFare * travellers),
    tax: String(fare.taxes * travellers),
    total: String(total),
    pax: String(travellers),
    brand: fare.brand,
  });

  return (
    <div className="flex flex-col rounded-xl border border-surface-border p-4 transition-colors hover:border-blue">
      <div className="flex items-center justify-between">
        <Badge tone={brandTone as "orange" | "blue" | "neutral"}>{fare.brand}</Badge>
        <span className="text-[0.7rem] font-bold text-ink-faint">
          {fare.seatsLeft} seats left
        </span>
      </div>
      <p className="mt-3 text-xl font-extrabold text-navy">{inr(total)}</p>
      <p className="text-[0.7rem] text-ink-faint">
        {inr(fare.baseFare * travellers)} fare + {inr(fare.taxes * travellers)} taxes
      </p>

      <ul className="mt-3 space-y-1.5 text-xs font-semibold text-ink-muted">
        <FareLine ok={fare.conditions.refundable} label="Refundable" />
        <FareLine ok label={`Cabin ${fare.conditions.cabinBaggage}`} />
        <FareLine ok label={`Check-in ${fare.conditions.checkInBaggage}`} />
        <FareLine ok={fare.conditions.seatChoice} label="Seat selection" />
        <FareLine ok={fare.conditions.mealIncluded} label="Meal included" />
      </ul>

      <div className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-center">
        <span className="text-[0.7rem] font-bold text-orange-700">
          Your earning {inr(fare.agentEarning * travellers)}
        </span>
      </div>

      <ButtonLink
        href={`/flights/book?${params.toString()}`}
        variant="accent"
        size="sm"
        className="mt-3 w-full"
      >
        Book Now
      </ButtonLink>
    </div>
  );
}

function FareLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {ok ? (
        <Check size={13} className="text-success" />
      ) : (
        <X size={13} className="text-ink-faint" />
      )}
      <span className={ok ? "" : "text-ink-faint line-through"}>{label}</span>
    </li>
  );
}
