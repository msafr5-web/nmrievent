import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
const valid = {
  kind: "conference", tier: "premium", guests: 500, days: 2, city: "riyadh", addOns: ["creative", "creative"],
  date: tomorrow, venueStatus: "searching", budget: "undecided", goals: "",
  name: "أحمد", organization: "شركة", email: "a@example.com", phone: "05 1234 5678", consent: true,
};

let ipCounter = 0;
const request = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/rfq", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": `10.0.0.${++ipCounter}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import("./route")).POST;
}

beforeEach(() => {
  vi.stubEnv("RFQ_WEBHOOK_URL", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/rfq", () => {
  it("201 وتمرير الطلب للـ Webhook موقّعًا، مع عدم تضخيم الإضافات المكررة", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const POST = await load({ RFQ_WEBHOOK_URL: "https://hook.test/x", RFQ_WEBHOOK_SECRET: "x".repeat(20) });

    const res = await POST(request(valid));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.reference).toMatch(/^NMR-/);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.addOns).toEqual(["creative"]);
    expect(sent.phone).toBe("0512345678");
    expect(sent).not.toHaveProperty("company_site");
    expect(fetchMock.mock.calls[0][1].headers["X-NMR-Signature"]).toMatch(/^sha256=/);
  });

  it("503 عند فشل الـ Webhook (لا يُعلَم العميل بنجاح كاذب)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    const POST = await load({ RFQ_WEBHOOK_URL: "https://hook.test/x" });
    expect((await POST(request(valid))).status).toBe(503);
  });

  it("503 في الإنتاج بدون Webhook، و201 في التطوير", async () => {
    expect((await (await load({ NODE_ENV: "production" }))(request(valid))).status).toBe(503);
    expect((await (await load({ NODE_ENV: "development" }))(request(valid))).status).toBe(201);
  });

  it("الـ Honeypot: نجاح وهمي دون استدعاء الـ Webhook", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const POST = await load({ RFQ_WEBHOOK_URL: "https://hook.test/x" });
    const res = await POST(request({ ...valid, company_site: "spam" }));
    expect(res.status).toBe(201);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("422 مع تفاصيل الحقول، و400 لـ JSON تالف، و413 لجسم كبير", async () => {
    const POST = await load({});
    const bad = await POST(request({ ...valid, email: "x", consent: false }));
    expect(bad.status).toBe(422);
    expect(Object.keys((await bad.json()).fields)).toEqual(expect.arrayContaining(["email", "consent"]));
    expect((await POST(request("{oops"))).status).toBe(400);
    expect((await POST(request("x".repeat(20_000)))).status).toBe(413);
  });

  it("429 بعد تجاوز الحد لنفس العنوان", async () => {
    const POST = await load({ NODE_ENV: "development", RFQ_RATE_LIMIT: "2" });
    const ip = { "x-real-ip": "203.0.113.9" };
    const codes = [];
    for (let i = 0; i < 3; i++) codes.push((await POST(request(valid, ip))).status);
    expect(codes).toEqual([201, 201, 429]);
  });

  it("يستخدم Redis للتحديد، وعند تعطله يرجع للذاكرة دون إيقاف النموذج", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("redis down"));
    vi.stubGlobal("fetch", fetchMock);
    const POST = await load({
      NODE_ENV: "development",
      UPSTASH_REDIS_REST_URL: "https://r.test",
      UPSTASH_REDIS_REST_TOKEN: "tok",
      RFQ_RATE_LIMIT: "1",
    });
    const ip = { "x-real-ip": "198.51.100.7" };
    expect((await POST(request(valid, ip))).status).toBe(201);
    expect((await POST(request(valid, ip))).status).toBe(429);
    expect(fetchMock.mock.calls[0][0]).toBe("https://r.test/pipeline");
  });

  it("429 عندما يعيد Redis عدّادًا فوق الحد", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ result: 99 }, { result: 1 }]))));
    const POST = await load({ NODE_ENV: "development", UPSTASH_REDIS_REST_URL: "https://r.test", UPSTASH_REDIS_REST_TOKEN: "tok" });
    expect((await POST(request(valid))).status).toBe(429);
  });
  it("مع قاعدة بيانات: فشل الـ Webhook لا يضيّع الطلب (201 والطلب معلّق للإعادة)", async () => {
    const { createMemoryLeadRepository } = await import("@/server/rfq/memory-lead-repository");
    const repo = createMemoryLeadRepository();
    vi.resetModules();
    vi.doMock("@/server/rfq/container", async (orig) => ({
      ...(await orig<typeof import("@/server/rfq/container")>()),
      getLeadRepository: () => repo,
    }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    vi.stubEnv("RFQ_WEBHOOK_URL", "https://hook.test/x");
    const { POST } = await import("./route");

    const res = await POST(request(valid));
    expect(res.status).toBe(201);
    const [row] = [...repo.rows.values()];
    expect(row.status).toBe("pending");
    expect(row.payload.reference).toBe((await res.json()).reference);
    vi.doUnmock("@/server/rfq/container");
  });
});
