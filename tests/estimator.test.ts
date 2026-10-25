import { describe, expect, it } from "vitest";
import { estimate } from "@/lib/estimator";

const base = { kind: "conference", tier: "essential", guests: 500, days: 1, city: "riyadh", addOns: [] } as const;

describe("حاسبة التكلفة المبدئية (FR-01)", () => {
  it("تعيد نطاقًا مرتبًا ومقربًا لأقرب 5,000", () => {
    const e = estimate({ ...base, addOns: [] });
    expect(e.low).toBeLessThan(e.mid);
    expect(e.mid).toBeLessThan(e.high);
    for (const v of [e.low, e.mid, e.high]) expect(v % 5000).toBe(0);
  });

  it("ترتفع التكلفة مع المستوى والحضور والخدمات والمدينة", () => {
    const b = estimate({ ...base, addOns: [] }).mid;
    expect(estimate({ ...base, addOns: [], tier: "signature" }).mid).toBeGreaterThan(b);
    expect(estimate({ ...base, addOns: [], guests: 5000 }).mid).toBeGreaterThan(b);
    expect(estimate({ ...base, addOns: ["hologram"] }).mid).toBeGreaterThan(b);
    expect(estimate({ ...base, addOns: [], city: "alula" }).mid).toBeGreaterThan(b);
  });

  it("تضبط القيم الشاذة (أيام وحضور)", () => {
    const e = estimate({ ...base, addOns: [], guests: 1, days: 99 });
    expect(e.mid).toBe(estimate({ ...base, addOns: [], guests: 10, days: 30 }).mid);
  });
});
