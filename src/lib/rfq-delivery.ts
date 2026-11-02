import { createHmac } from "node:crypto";

export type DeliveryOptions = {
  url: string;
  secret?: string;
  timeoutMs: number;
  /** عدد المحاولات الإضافية بعد الأولى */
  retries?: number;
  retryDelayMs?: number;
  fetchImpl?: typeof fetch;
};

export class DeliveryError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "DeliveryError";
  }
}

export function signPayload(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * يسلّم الطلب إلى الـ Webhook مع مهلة وتوقيع HMAC ومفتاح عدم التكرار (Idempotency-Key)
 * وإعادة محاولة على أخطاء الشبكة و5xx فقط. يرمي DeliveryError عند الفشل النهائي.
 */
export async function deliverLead(lead: { reference: string }, opts: DeliveryOptions): Promise<void> {
  const { url, secret, timeoutMs, retries = 1, retryDelayMs = 300, fetchImpl = fetch } = opts;
  const body = JSON.stringify(lead);
  let lastError: DeliveryError = new DeliveryError("unknown");

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(retryDelayMs * attempt);
    const timestamp = Date.now().toString();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": lead.reference,
      "X-NMR-Timestamp": timestamp,
    };
    if (secret) headers["X-NMR-Signature"] = `sha256=${signPayload(secret, timestamp, body)}`;

    try {
      const res = await fetchImpl(url, { method: "POST", headers, body, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) return;
      lastError = new DeliveryError(`webhook responded ${res.status}`, res.status);
      if (res.status < 500) throw lastError; // أخطاء 4xx لا تُعاد
    } catch (err) {
      if (err instanceof DeliveryError && err.status !== undefined && err.status < 500) throw err;
      lastError = err instanceof DeliveryError ? err : new DeliveryError(err instanceof Error ? err.message : "network error");
    }
  }
  throw lastError;
}
