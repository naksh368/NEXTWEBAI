import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Refresh every public page after a catalogue change. Prices and packages
 * appear in the announcement bar (in the root layout), the homepage, listings,
 * island pages and the AI planner, so a change must reach all of them at once.
 */
export function refreshPublicSite() {
  revalidateTag("packages");
  revalidateTag("destinations");
  revalidatePath("/", "layout");
}
