import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("يطبّق القيم الافتراضية ويعامل النص الفارغ كغير مضبوط", () => {
    const e = parseServerEnv({ RFQ_WEBHOOK_URL: "", RFQ_WEBHOOK_SECRET: "" });
    expect(e.RFQ_WEBHOOK_URL).toBeUndefined();
    expect(e.RFQ_WEBHOOK_SECRET).toBeUndefined();
    expect(e.RFQ_RATE_LIMIT).toBe(5);
    expect(e.RFQ_WEBHOOK_TIMEOUT_MS).toBe(5000);
  });

  it("يفشل باسم المتغير فقط دون تسريب قيمته", () => {
    expect(() => parseServerEnv({ RFQ_WEBHOOK_URL: "not-a-url-secret" })).toThrow(/RFQ_WEBHOOK_URL/);
    expect(() => parseServerEnv({ RFQ_WEBHOOK_URL: "not-a-url-secret" })).not.toThrow(/not-a-url-secret/);
  });

  it("يرفض سرًا قصيرًا", () => {
    expect(() => parseServerEnv({ RFQ_WEBHOOK_SECRET: "short" })).toThrow(/RFQ_WEBHOOK_SECRET/);
  });
});
