import Link from "next/link";
import { Palmtree } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Site-wide announcement bar. The text, link and on/off switch all come from
 * the admin "Website content" settings — nothing here is hard-coded, and no
 * discount or claim appears unless an administrator wrote it.
 */
export async function PromoBar() {
  const s = await getSiteSettings();
  if (!s.announcementEnabled || !s.announcementText.trim()) return null;

  const body = (
    <span className="inline-flex items-center gap-2 text-center">
      <Palmtree className="hidden h-4 w-4 shrink-0 text-brand-turquoise sm:block" aria-hidden />
      {s.announcementText}
    </span>
  );

  return (
    <div className="bg-brand-navy text-white print:hidden">
      <div className="mx-auto flex max-w-[1200px] items-center justify-center px-4 py-2 text-xs font-semibold sm:text-[13px]">
        {s.announcementHref ? (
          <Link href={s.announcementHref} className="underline-offset-4 hover:underline">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
