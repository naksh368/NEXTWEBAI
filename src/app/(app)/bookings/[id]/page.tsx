import { notFound } from "next/navigation";
import { BookingDetail } from "@/components/app/booking-detail";
import { bookingById } from "@/data/bookings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Booking ${id}` };
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = bookingById(id);
  if (!booking) notFound();
  return <BookingDetail booking={booking} />;
}
