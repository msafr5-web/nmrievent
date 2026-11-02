import type { RateLimiterOptions } from "./rate-limit";

export type RedisRateLimiterOptions = Pick<RateLimiterOptions, "limit" | "windowMs"> & {
  url: string;
  token: string;
  prefix?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/**
 * محدِّد معدل موزّع عبر Upstash Redis (REST) — INCR مع PEXPIRE NX في طلب Pipeline واحد.
 * يرمي عند فشل Redis ليقرر المستدعي سياسة الاحتياط (Fail-open/Fallback).
 */
export function createRedisRateLimiter({
  url, token, limit, windowMs, prefix = "rl:rfq:", timeoutMs = 1_500, fetchImpl = fetch,
}: RedisRateLimiterOptions) {
  return {
    async isLimited(key: string): Promise<boolean> {
      const k = `${prefix}${key}`;
      const res = await fetchImpl(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", k], ["PEXPIRE", k, String(windowMs), "NX"]]),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`redis responded ${res.status}`);
      const out = (await res.json()) as { result?: unknown; error?: string }[];
      const count = Number(out[0]?.result);
      if (out[0]?.error || !Number.isFinite(count)) throw new Error("redis returned an invalid reply");
      return count > limit;
    },
  };
}
