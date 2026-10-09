import { NextResponse } from "next/server";
import { getPackageBySlug } from "@/lib/queries";
import { getSiteSettings, promoIsActive } from "@/lib/site-settings";
import { PdfDoc, PDF_COLORS as C, textWidth, toWinAnsi } from "@/lib/pdf";
import { loadBrandLogo, loadImages } from "@/lib/pdf-assets";
import { formatDate, formatINR, getSiteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const revalidate = 300;

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];
}

/** Rupees without the ₹ glyph, which the standard PDF fonts cannot show. */
function money(amount: number): string {
  return `INR ${formatINR(amount).replace(/^₹/, "")}`;
}

/**
 * GET /packages/[slug]/itinerary.pdf
 *
 * A real, downloadable PDF of the published itinerary, generated on the
 * server from the same database records the web page uses — so the document a
 * customer saves can never drift from what the site shows.
 *
 * Only PUBLISHED packages are served; a draft or archived package 404s rather
 * than leaking unreleased pricing.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [pkg, settings] = await Promise.all([getPackageBySlug(slug), getSiteSettings()]);
  if (!pkg) {
    return NextResponse.json({ ok: false, error: "Package not found." }, { status: 404 });
  }

  const v = pkg.currentVersion!;

  // Artwork is loaded up front and fails soft: a photograph we cannot fetch is
  // left out, and the document still renders completely.
  const photoSources = v.images.slice(0, 5).map((i) => i.url);
  const [logo, photos] = await Promise.all([loadBrandLogo(), loadImages(photoSources, 900)]);
  const usablePhotos = photos
    .map((bytes, i) => ({ bytes, alt: v.images[i]?.alt ?? "" }))
    .filter((p): p is { bytes: Buffer; alt: string } => p.bytes !== null);

  const doc = new PdfDoc();
  const left = doc.margin;
  const right = doc.width - doc.margin;
  const priceKnown = v.pricingStatus !== "PRICE_REVIEW_REQUIRED";
  const promoLive = promoIsActive(settings);

  // ── Masthead ───────────────────────────────────────────
  const mastheadH = 96;
  doc.rect(0, 0, doc.width, mastheadH, C.navy);
  doc.rect(0, mastheadH, doc.width, 3.5, C.turquoise);

  // The supplied artwork is dark navy, so it is set in a white chip rather
  // than flattened onto the navy band where it would disappear. If the file is
  // missing we fall back to the wordmark as text.
  let logoDrawn = false;
  if (logo) {
    const chipW = 112;
    const chipH = 72;
    doc.rect(left, 12, chipW, chipH, C.white);
    logoDrawn = doc.image(logo, left + 5, 17, chipW - 10, chipH - 10);
  }
  const textX = logoDrawn ? left + 126 : left;
  doc.drawLine(toWinAnsi(settings.brandName), textX, 30, "Helvetica-Bold", 17, C.white);
  doc.drawLine(toWinAnsi(settings.tagline), textX, 53, "Helvetica", 9, [0.72, 0.82, 0.9]);

  const docLabel = "HOLIDAY ITINERARY";
  doc.drawLine(docLabel, right - textWidth(docLabel, "Helvetica-Bold", 9), 30, "Helvetica-Bold", 9, C.turquoise);
  const ref = toWinAnsi(pkg.code ?? pkg.slug);
  doc.drawLine(ref, right - textWidth(ref, "Helvetica", 9), 47, "Helvetica", 9, [0.72, 0.82, 0.9]);
  const issued = `Issued ${formatDate(new Date())}`;
  doc.drawLine(issued, right - textWidth(issued, "Helvetica", 9), 62, "Helvetica", 9, [0.72, 0.82, 0.9]);

  doc.y = mastheadH + 22;

  // ── Hero photograph + supporting strip ─────────────────
  if (usablePhotos.length) {
    const heroH = 150;
    doc.imageCover(usablePhotos[0].bytes, left, doc.y, doc.contentWidth, heroH);
    doc.y += heroH;

    const strip = usablePhotos.slice(1, 5);
    if (strip.length) {
      const gap = 6;
      const thumbW = (doc.contentWidth - gap * (strip.length - 1)) / strip.length;
      const thumbH = 62;
      strip.forEach((photo, i) => {
        doc.imageCover(photo.bytes, left + i * (thumbW + gap), doc.y + gap, thumbW, thumbH);
      });
      doc.y += thumbH + gap;
    }
    doc.y += 18;
  }

  // ── Title + key facts ──────────────────────────────────
  doc.text(pkg.name, { font: "Helvetica-Bold", size: 20, color: C.navy, leading: 25, gapAfter: 4 });
  doc.text(
    [
      `${v.durationNights} nights / ${v.durationDays} days`,
      pkg.destination.name,
      v.roomCategory ?? null,
      v.minTravellers > 1 ? `minimum ${v.minTravellers} travellers` : null,
    ].filter(Boolean).join("  -  "),
    { size: 9.5, color: C.muted, gapAfter: 12 }
  );

  // Price panel
  const panelH = 54;
  doc.ensure(panelH + 12);
  doc.rect(left, doc.y, doc.contentWidth, panelH, C.softBg);
  doc.drawLine("STARTING FROM", left + 14, doc.y + 12, "Helvetica-Bold", 7.5, C.muted);
  doc.drawLine(
    priceKnown ? money(v.basePrice) : "Price on request",
    left + 14, doc.y + 24, "Helvetica-Bold", 17, C.navy
  );
  doc.drawLine(
    priceKnown
      ? `${v.perPersonPricing ? "per person, twin sharing" : "for the whole group"}${v.minTravellers > 1 ? `  -  min ${v.minTravellers} pax` : ""}${v.pricingStatus === "INDICATIVE" ? "  -  indicative rate" : ""}`
      : "Confirmed in writing by our team",
    left + 14, doc.y + 44, "Helvetica", 8.5, C.muted
  );
  if (promoLive) {
    const validity = toWinAnsi(`Valid ${formatDate(settings.promoValidFrom)} - ${formatDate(settings.promoValidTo)}`);
    doc.drawLine(validity, right - 14 - textWidth(validity, "Helvetica-Bold", 8.5), doc.y + 24, "Helvetica-Bold", 8.5, C.orange);
  }
  doc.y += panelH + 16;

  if (v.summary) doc.text(v.summary, { size: 10, color: C.ink, gapAfter: 10 });

  // ── Section helper ─────────────────────────────────────
  const heading = (title: string) => {
    doc.ensure(34);
    doc.y += 6;
    doc.drawLine(toWinAnsi(title.toUpperCase()), left, doc.y, "Helvetica-Bold", 10.5, C.blue);
    doc.y += 15;
    doc.line(left, doc.y, right, C.border, 0.8);
    doc.y += 10;
  };

  const highlights = arr(v.highlights);
  if (highlights.length) {
    heading("Highlights");
    for (const h of highlights) doc.bullet(h, { marker: "+", color: C.ink });
    doc.y += 6;
  }

  // ── Day by day ─────────────────────────────────────────
  if (v.days.length) {
    heading("Day-by-day itinerary");
    for (const day of v.days) {
      doc.ensure(44);
      doc.y += 4;
      const badge = `DAY ${day.dayNumber}`;
      const badgeW = textWidth(badge, "Helvetica-Bold", 8) + 14;
      doc.rect(left, doc.y, badgeW, 15, C.turquoise);
      doc.drawLine(badge, left + 7, doc.y + 3.5, "Helvetica-Bold", 8, C.navy);
      doc.text(day.title, {
        font: "Helvetica-Bold", size: 11, color: C.navy,
        x: left + badgeW + 9, maxWidth: doc.contentWidth - badgeW - 9, leading: 14,
      });
      doc.y += 3;
      if (day.summary) doc.text(day.summary, { size: 9, color: C.muted, x: left + 2, gapAfter: 3 });
      for (const item of day.items) {
        doc.bullet(item.description ? `${item.title} - ${item.description}` : item.title, { size: 9, color: C.ink });
      }
      doc.y += 7;
    }
  }

  const inclusions = arr(v.inclusions);
  if (inclusions.length) {
    heading("What is included");
    for (const i of inclusions) doc.bullet(i, { marker: "+", color: C.ink });
    doc.y += 6;
  }

  const exclusions = arr(v.exclusions);
  if (exclusions.length) {
    heading("What is not included");
    for (const e of exclusions) doc.bullet(e, { marker: "x", color: C.muted });
    doc.y += 6;
  }

  if (v.importantInfo) {
    heading("Important information");
    for (const line of v.importantInfo.split("\n").filter(Boolean)) doc.bullet(line, { color: C.ink });
    doc.y += 6;
  }

  if (v.cancellationPolicy) {
    heading("Cancellation");
    doc.text(v.cancellationPolicy, { size: 9, color: C.muted, gapAfter: 6 });
  }

  // ── Pricing basis + contact ────────────────────────────
  heading("About this quotation");
  doc.text(settings.priceDisclaimer, { size: 9, color: C.muted, gapAfter: 8 });

  doc.ensure(70);
  doc.rect(left, doc.y, doc.contentWidth, 2.5, C.orange);
  doc.y += 12;
  doc.text("Talk to us", { font: "Helvetica-Bold", size: 11, color: C.navy, leading: 15 });
  const contactLines = [
    settings.phonePrimary ? `Phone: ${settings.phonePrimary}` : null,
    settings.email ? `Email: ${settings.email}` : null,
    settings.addressLines.filter(Boolean).length ? settings.addressLines.filter(Boolean).join(", ") : null,
    getSiteUrl().replace(/^https?:\/\//, ""),
  ].filter(Boolean) as string[];
  for (const line of contactLines) doc.text(line, { size: 9, color: C.muted, leading: 12.5 });

  const bytes = doc.build((page, total) => ({
    left: `${settings.brandName} - ${pkg.name}`,
    right: `Page ${page} of ${total}`,
  }));

  const filename = `${pkg.slug}-itinerary.pdf`;
  // Buffer → Uint8Array keeps the Response body type exact.
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
