import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC 4180 escaping, with the leading-character guard spreadsheets need. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // A cell starting with = + - @ is executed as a formula by Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const COLUMNS: { header: string; key: string }[] = [
  { header: "Reference", key: "reference" },
  { header: "Received", key: "createdAt" },
  { header: "Status", key: "status" },
  { header: "Name", key: "fullName" },
  { header: "Phone", key: "phone" },
  { header: "Email", key: "email" },
  { header: "Package", key: "packageName" },
  { header: "Destination", key: "destination" },
  { header: "Travel date", key: "travelDate" },
  { header: "Adults", key: "adults" },
  { header: "Children", key: "children" },
  { header: "Travellers", key: "travellers" },
  { header: "Budget", key: "budget" },
  { header: "Message", key: "message" },
  { header: "Assigned to", key: "assignedTo" },
  { header: "Follow up on", key: "followUpAt" },
  { header: "Internal notes", key: "internalNotes" },
];

/**
 * GET /api/admin/enquiries/export — CSV of the current filter selection.
 *
 * Internal notes ARE included: this file is for the agency's own records and
 * the download is gated behind the same permission as the enquiry list. It is
 * never linked from a public page.
 */
export async function GET(request: Request) {
  const admin = await authorize("enquiry.view");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim();
  const ids = (url.searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const where: Prisma.EnquiryWhereInput = {
    ...(ids.length ? { id: { in: ids } } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { packageName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await db.enquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { assignedTo: { select: { fullName: true } } },
  });

  const body = [
    COLUMNS.map((c) => csvCell(c.header)).join(","),
    ...rows.map((r) =>
      COLUMNS.map((c) => {
        switch (c.key) {
          case "createdAt": return csvCell(r.createdAt.toISOString());
          case "followUpAt": return csvCell(r.followUpAt ? r.followUpAt.toISOString().slice(0, 10) : "");
          case "assignedTo": return csvCell(r.assignedTo?.fullName ?? "");
          default: return csvCell((r as unknown as Record<string, unknown>)[c.key]);
        }
      }).join(",")
    ),
  ].join("\r\n");

  await writeAudit({
    adminUserId: admin.id,
    action: "enquiry.export",
    resource: "Enquiry",
    after: { count: rows.length, status: status || "all", filtered: Boolean(q || ids.length) },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${body}`, {
    headers: {
      // The BOM makes Excel open UTF-8 correctly on Windows.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
