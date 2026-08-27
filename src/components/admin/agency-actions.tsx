"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { decideAgency, adjustWallet } from "@/app/admin/(panel)/agencies/actions";

export function KycActions({ agentId, status }: { agentId: string; status: string }) {
  const [mode, setMode] = useState<null | "REJECT" | "REQUEST_CORRECTION">(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status !== "APPROVED" && (
          <form action={decideAgency}>
            <input type="hidden" name="agentId" value={agentId} />
            <input type="hidden" name="decision" value="APPROVE" />
            <Button size="sm" variant="primary">Approve</Button>
          </form>
        )}
        <Button size="sm" variant="outline" onClick={() => setMode(mode === "REQUEST_CORRECTION" ? null : "REQUEST_CORRECTION")}>Request Correction</Button>
        <Button size="sm" variant="outline" onClick={() => setMode(mode === "REJECT" ? null : "REJECT")}>Reject</Button>
        {status !== "SUSPENDED" ? (
          <form action={decideAgency}>
            <input type="hidden" name="agentId" value={agentId} />
            <input type="hidden" name="decision" value="SUSPEND" />
            <Button size="sm" variant="danger">Suspend</Button>
          </form>
        ) : (
          <form action={decideAgency}>
            <input type="hidden" name="agentId" value={agentId} />
            <input type="hidden" name="decision" value="ACTIVATE" />
            <Button size="sm" variant="primary">Activate</Button>
          </form>
        )}
      </div>

      {mode && (
        <form action={decideAgency} className="space-y-2 rounded-xl border border-surface-border bg-surface-muted/40 p-3">
          <input type="hidden" name="agentId" value={agentId} />
          <input type="hidden" name="decision" value={mode} />
          <label className="text-sm font-semibold">{mode === "REJECT" ? "Rejection reason" : "What needs correcting?"}</label>
          <Textarea name="reason" required placeholder="This message is shown to the agent…" />
          <Button size="sm" variant={mode === "REJECT" ? "danger" : "orange"}>{mode === "REJECT" ? "Confirm Rejection" : "Send Correction Request"}</Button>
        </form>
      )}
    </div>
  );
}

export function WalletAdjust({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>Manual adjustment</Button>
      {open && (
        <form action={adjustWallet} className="mt-3 space-y-2 rounded-xl border border-surface-border bg-surface-muted/40 p-3">
          <input type="hidden" name="agentId" value={agentId} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Amount (₹)</label>
              <Input name="amount" type="number" min={1} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Direction</label>
              <select name="direction" className="h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-sm">
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Reason</label>
            <Input name="reason" required placeholder="Why this adjustment?" />
          </div>
          <Button size="sm">Apply adjustment</Button>
          <p className="text-xs text-ink-faint">Every adjustment is recorded in the ledger and audit log.</p>
        </form>
      )}
    </div>
  );
}
