import type { ServerEnv } from "@/lib/env";
import { getPool } from "../db";
import type { LeadRepository } from "./lead-repository";
import { createPgLeadRepository } from "./pg-lead-repository";

/** مستودع الطلبات أو null إن لم تُضبط DATABASE_URL. الـ Pool مشترك مع لوحة التحكم (src/server/db.ts). */
export function getLeadRepository(env: Pick<ServerEnv, "DATABASE_URL">): LeadRepository | null {
  const pool = getPool(env.DATABASE_URL);
  return pool ? createPgLeadRepository(pool) : null;
}

export function getWebhook(env: Pick<ServerEnv, "RFQ_WEBHOOK_URL" | "RFQ_WEBHOOK_SECRET" | "RFQ_WEBHOOK_TIMEOUT_MS">) {
  return env.RFQ_WEBHOOK_URL
    ? { url: env.RFQ_WEBHOOK_URL, secret: env.RFQ_WEBHOOK_SECRET, timeoutMs: env.RFQ_WEBHOOK_TIMEOUT_MS }
    : null;
}
