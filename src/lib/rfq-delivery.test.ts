import { describe, expect, it, vi } from "vitest";
import { DeliveryError, deliverLead, signPayload } from "./rfq-delivery";

const lead = { reference: "NMR-26-ABC234" };
const opts = { url: "https://hook.test/x", timeoutMs: 1000, retryDelayMs: 0 };
const res = (status: number) => new Response(null, { status });

describe("deliverLead", () => {
  it("يرسل ترويسات التوقيع والـ Idempotency-Key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200));
    await deliverLead(lead, { ...opts, secret: "s".repeat(16), fetchImpl });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers["Idempotency-Key"]).toBe(lead.reference);
    const ts = init.headers["X-NMR-Timestamp"];
    expect(init.headers["X-NMR-Signature"]).toBe(`sha256=${signPayload("s".repeat(16), ts, init.body)}`);
  });

  it("لا يوقّع بدون سر", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200));
    await deliverLead(lead, { ...opts, fetchImpl });
    expect(fetchImpl.mock.calls[0][1].headers["X-NMR-Signature"]).toBeUndefined();
  });

  it("يعيد المحاولة على 5xx وينجح", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(res(502)).mockResolvedValueOnce(res(200));
    await deliverLead(lead, { ...opts, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("يعيد المحاولة على أخطاء الشبكة ثم يرمي عند الفشل", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    await expect(deliverLead(lead, { ...opts, fetchImpl })).rejects.toBeInstanceOf(DeliveryError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("لا يعيد المحاولة على 4xx", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(401));
    await expect(deliverLead(lead, { ...opts, fetchImpl })).rejects.toMatchObject({ status: 401 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
