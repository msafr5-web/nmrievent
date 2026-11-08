import { afterEach, describe, expect, it, vi } from "vitest";

const SECRET = "s".repeat(20);
const req = (auth?: string) =>
  new Request("http://localhost/api/rfq/retry", { headers: auth ? { authorization: auth } : {} });

async function load(env: Record<string, string>, repo: unknown = {}) {
  vi.resetModules();
  vi.doMock("@/server/rfq/container", () => ({
    getLeadRepository: () => repo,
    getWebhook: () => (env.RFQ_WEBHOOK_URL ? { url: env.RFQ_WEBHOOK_URL, timeoutMs: 1000 } : null),
  }));
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("./route");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("@/server/rfq/container");
});

describe("GET /api/rfq/retry", () => {
  it("401 بدون سر مضبوط أو بتوثيق خاطئ", async () => {
    expect((await (await load({})).GET(req(`Bearer ${SECRET}`))).status).toBe(401);
    const m = await load({ CRON_SECRET: SECRET, RFQ_WEBHOOK_URL: "https://h.test" });
    expect((await m.GET(req())).status).toBe(401);
    expect((await m.GET(req("Bearer wrong-secret-value-00"))).status).toBe(401);
  });

  it("409 إن لم تُضبط قاعدة البيانات", async () => {
    const m = await load({ CRON_SECRET: SECRET }, null);
    expect((await m.GET(req(`Bearer ${SECRET}`))).status).toBe(409);
  });

  it("بدون webhook: لا إعادة تسليم لكن الحذف حسب الاحتفاظ يعمل", async () => {
    const repo = { claimPending: vi.fn(), purgeOlderThan: vi.fn().mockResolvedValue(3) };
    const m = await load({ CRON_SECRET: SECRET, RFQ_RETENTION_DAYS: "90" }, repo);
    const res = await m.GET(req(`Bearer ${SECRET}`));
    expect(await res.json()).toEqual({ claimed: 0, delivered: 0, failed: 0, purged: 3, applicationsPurged: 0 });
    expect(repo.claimPending).not.toHaveBeenCalled();
    expect(repo.purgeOlderThan).toHaveBeenCalledWith(90);
  });

  it("200 ويعيد ملخص التشغيل", async () => {
    const repo = { claimPending: vi.fn().mockResolvedValue([]), purgeOlderThan: vi.fn().mockResolvedValue(0) };
    const m = await load({ CRON_SECRET: SECRET, RFQ_WEBHOOK_URL: "https://h.test" }, repo);
    const res = await m.GET(req(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 0, delivered: 0, failed: 0, purged: 0, applicationsPurged: 0 });
    expect(repo.purgeOlderThan).toHaveBeenCalledWith(180);
  });
});
