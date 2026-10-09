/**
 * The places JST Andaman Travels sells — all within the Andaman & Nicobar
 * Islands. This is the single list used by the admin "Add Andaman destinations"
 * action, which upserts them idempotently so a destination can be restored
 * without re-running the full seed.
 *
 * JST sells Andaman holidays only. Nothing outside the islands belongs here.
 */
export type SeedDestination = {
  name: string;
  /** The island base a stay here runs from (day-trip sights point at their hub). */
  hub: string;
  popular?: boolean;
  summary?: string;
};

export const ANDAMAN_DESTINATIONS: SeedDestination[] = [
  { name: "Port Blair", hub: "port-blair", popular: true, summary: "The island capital and the gateway to every Andaman itinerary." },
  { name: "Havelock Island", hub: "havelock-island", popular: true, summary: "Swaroop Dweep — white sand, turquoise shallows and the best diving in the group." },
  { name: "Neil Island", hub: "neil-island", popular: true, summary: "Shaheed Dweep — a small, quiet island of coral shallows and paddy fields." },
  { name: "Radhanagar Beach", hub: "havelock-island", popular: true, summary: "Havelock's famous west-coast crescent, facing the sunset." },
  { name: "Kalapathar Beach", hub: "havelock-island", summary: "Havelock's sunrise beach, named for the black rocks along its shore." },
  { name: "Ross Island", hub: "port-blair", summary: "Colonial ruins held together by banyan roots, a short boat ride from Port Blair." },
  { name: "North Bay Island", hub: "port-blair", summary: "The coral reef closest to Port Blair — snorkelling and glass-bottom boats." },
  { name: "Cellular Jail", hub: "port-blair", summary: "The colonial prison in Port Blair and its evening Light & Sound Show." },
  { name: "Baratang Island", hub: "port-blair", summary: "Limestone caves and the mud volcano, reached through the mangrove creeks." },
  { name: "Corbyn's Cove", hub: "port-blair", summary: "The palm-lined beach closest to Port Blair town." },
];

/** @deprecated Use ANDAMAN_DESTINATIONS. Kept so older imports keep compiling. */
export const POPULAR_DESTINATIONS = ANDAMAN_DESTINATIONS;
