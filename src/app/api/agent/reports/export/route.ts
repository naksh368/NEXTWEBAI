import { NextResponse } from "next/server";
import { authorizeAgent } from "@/lib/agent-auth";
import { listTransactions } from "@/lib/services/wallet-service";

/** CSV export of the agent's wallet ledger (their own data only). */
export async function GET() {
  const agent = await authorizeAgent();
  if (!agent) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const txns = await listTransactions(agent.id, 5000);
  const header = ["Reference", "Date", "Type", "Direction", "Amount", "Balance After", "Description"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = txns.map((t) =>
    [t.reference, t.createdAt.toISOString(), t.type, t.direction, String(t.amount), String(t.availableAfter), t.description ?? ""].map(esc).join(",")
  );
  const csv = [header.map(esc).join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expertztrip-wallet-${Date.now()}.csv"`,
    },
  });
}
