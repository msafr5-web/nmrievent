import type { ClaimedLead, Lead, LeadRepository, LeadStatus } from "./lead-repository";

type Row = { payload: Lead; status: LeadStatus; attempts: number; nextAt: number; createdAt: number };

/** تخزين في الذاكرة للاختبارات فقط (لا يصمد عند إعادة التشغيل) */
export function createMemoryLeadRepository(now: () => number = Date.now) {
  const rows = new Map<string, Row>();
  const repo: LeadRepository = {
    async create(lead, status) {
      if (rows.has(lead.reference)) return false;
      rows.set(lead.reference, { payload: lead, status, attempts: 0, nextAt: now(), createdAt: now() });
      return true;
    },
    async markDelivered(ref) {
      const r = rows.get(ref);
      if (r) r.status = "delivered";
    },
    async markFailed(ref, _error, maxAttempts) {
      const r = rows.get(ref);
      if (!r || r.status === "delivered") return;
      r.attempts += 1;
      r.status = r.attempts >= maxAttempts ? "failed" : "pending";
      r.nextAt = now() + 60_000 * 2 ** Math.min(r.attempts - 1, 10);
    },
    async claimPending(limit, maxAttempts) {
      const out: ClaimedLead[] = [];
      for (const [reference, r] of rows) {
        if (out.length >= limit) break;
        if (r.status === "pending" && r.attempts < maxAttempts && r.nextAt <= now()) {
          r.nextAt = now() + 5 * 60_000;
          out.push({ reference, payload: r.payload, attempts: r.attempts });
        }
      }
      return out;
    },
    async purgeOlderThan(days) {
      const cutoff = now() - days * 86_400_000;
      let n = 0;
      for (const [ref, r] of rows) {
        if (r.status !== "pending" && r.createdAt < cutoff) {
          rows.delete(ref);
          n++;
        }
      }
      return n;
    },
  };
  return Object.assign(repo, { rows });
}
