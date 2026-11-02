import { describe, expect, it } from "vitest";
import { rfqSchema } from "./rfq";
import { referenceNumber } from "./rfq-shared";

const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

const valid = {
  kind: "conference",
  tier: "premium",
  guests: 500,
  days: 2,
  city: "riyadh",
  addOns: ["creative"],
  date: tomorrow,
  venueStatus: "searching",
  budget: "undecided",
  goals: "",
  name: "أحمد",
  organization: "شركة الاختبار",
  email: "a@example.com",
  phone: "0512345678",
  consent: true,
};

const parse = (over: Record<string, unknown> = {}) => rfqSchema.safeParse({ ...valid, ...over });

describe("rfqSchema", () => {
  it("يقبل طلبًا صحيحًا", () => {
    expect(parse().success).toBe(true);
  });

  it.each(["05 1234 5678", "05-1234-5678", "+966512345678", "966512345678"])("يقبل الهاتف %s ويزيل الفواصل", (phone) => {
    const r = parse({ phone });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).not.toMatch(/[\s-]/);
  });

  it.each(["0412345678", "05123", "abc"])("يرفض الهاتف %s", (phone) => {
    expect(parse({ phone }).success).toBe(false);
  });

  it("يزيل تكرار الإضافات", () => {
    const r = parse({ addOns: ["hologram", "hologram", "creative"] });
    expect(r.success && r.data.addOns).toEqual(["hologram", "creative"]);
  });

  it("الحقل الفخ المعبّأ لا يفشل التحقق (يعالجه المسار بنجاح وهمي)", () => {
    const r = parse({ company_site: "http://spam.example" });
    expect(r.success && r.data.company_site).toBe("http://spam.example");
  });

  it.each(["", "2020-01-01", "2026/12/01", "2026-02-30", "not-a-date"])("يرفض التاريخ '%s'", (date) => {
    expect(parse({ date }).success).toBe(false);
  });

  it("يرفض الموافقة الناقصة وعدد الحضور خارج الحدود", () => {
    expect(parse({ consent: false }).success).toBe(false);
    expect(parse({ guests: 9 }).success).toBe(false);
    expect(parse({ guests: 500_001 }).success).toBe(false);
  });

  it("يرفض معرّفات غير معروفة", () => {
    expect(parse({ kind: "wedding" }).success).toBe(false);
    expect(parse({ addOns: ["nope"] }).success).toBe(false);
  });
});

describe("referenceNumber", () => {
  it("يطابق الصيغة ولا يتكرر عمليًا", () => {
    const refs = new Set(Array.from({ length: 2000 }, () => referenceNumber()));
    expect(refs.size).toBe(2000);
    for (const r of refs) expect(r).toMatch(/^NMR-\d{2}-[2-9A-HJ-NP-Z]{6}$/);
  });
});
