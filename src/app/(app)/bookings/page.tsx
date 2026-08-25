import { BookingsList } from "@/components/app/bookings-list";
import { BOOKINGS } from "@/data/bookings";

export const metadata = { title: "My Bookings" };

export default function BookingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">My Bookings</h1>
        <p className="mt-1 text-ink-muted">
          Track every ticket, cancellation and refund in one place.
        </p>
      </div>
      <BookingsList bookings={BOOKINGS} />
    </div>
  );
}
