import { describe, expect, it } from "vitest";
import { rfqSchema } from "@/lib/rfq";
import { staffSchema } from "@/server/schemas";

describe("التحقق من المدخلات", () => {
  it("يقبل تسجيل موظف صحيح ويطبع الجوال والبريد", () => {
    const r = staffSchema.parse({ name: "سلطان بن فهد الشمري", phone: "050 123 4567", education: "بكالوريوس", email: "S@X.SA" });
    expect(r.phone).toBe("0501234567");
    expect(r.email).toBe("s@x.sa");
  });
  it("يرفض جوالًا غير سعودي ومستوى تعليمي غير معروف", () => {
    expect(staffSchema.safeParse({ name: "اسم ثلاثي كامل", phone: "0401234567", education: "بكالوريوس", email: "a@b.sa" }).success).toBe(false);
    expect(staffSchema.safeParse({ name: "اسم ثلاثي كامل", phone: "0501234567", education: "أخرى", email: "a@b.sa" }).success).toBe(false);
  });
  it("يرفض طلب RFQ بلا موافقة على الخصوصية", () => {
    const base = { kind: "conference", tier: "premium", guests: 100, days: 1, city: "riyadh", addOns: [], date: "2027-01-01", venueStatus: "booked", budget: "undecided", name: "محمد", organization: "جهة", email: "a@b.sa", phone: "0551234567" };
    expect(rfqSchema.safeParse({ ...base, consent: true }).success).toBe(true);
    expect(rfqSchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });
});
