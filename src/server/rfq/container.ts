import { Pool } from "pg";
import type { ServerEnv } from "@/lib/env";
import type { LeadRepository } from "./lead-repository";
import { createPgLeadRepository } from "./pg-lead-repository";

const g = globalThis as unknown as { __nmrPool?: Pool };

/** مستودع الطلبات أو null إن لم تُضبط DATABASE_URL. الـ Pool مشترك لتفادي استنزاف الاتصالات عند HMR/serverless */
export function getLeadRepository(env: Pick<ServerEnv, "DATABASE_URL">): LeadRepository | null {
  if (!env.DATABASE_URL) return null;
  g.__nmrPool ??= new Pool({
    connectionString: env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 10_000,
  });
  return createPgLeadRepository(g.__nmrPool);
}

export function getWebhook(env: Pick<ServerEnv, "RFQ_WEBHOOK_URL" | "RFQ_WEBHOOK_SECRET" | "RFQ_WEBHOOK_TIMEOUT_MS">) {
  return env.RFQ_WEBHOOK_URL
    ? { url: env.RFQ_WEBHOOK_URL, secret: env.RFQ_WEBHOOK_SECRET, timeoutMs: env.RFQ_WEBHOOK_TIMEOUT_MS }
    : null;
}
