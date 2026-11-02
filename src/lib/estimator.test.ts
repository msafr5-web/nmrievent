import { describe, expect, it } from "vitest";
import { estimate, type EstimateInput } from "./estimator";

const base: EstimateInput = { kind: "conference", tier: "essential", guests: 100, days: 1, city: "riyadh", addOns: [] };

describe("estimate", () => {
  it("يحسب السعر الأساسي: (base + perGuest × guests) مقرّبًا لأقرب 5000", () => {
    // 60,000 + 420×100 = 102,000 → 100,000
    expect(estimate(base).mid).toBe(100_000);
  });

  it("يحافظ على low < mid < high", () => {
    const e = estimate(base);
    expect(e.low).toBeLessThan(e.mid);
    expect(e.high).toBeGreaterThan(e.mid);
  });

  it("الأيام الإضافية أقل كلفة من اليوم الأول (معامل 0.45)", () => {
    const one = estimate(base).mid;
    const two = estimate({ ...base, days: 2 }).mid;
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThan(one * 2);
  });

  it("معامل المدينة والمستوى يرفعان التقدير", () => {
    expect(estimate({ ...base, city: "neom-redsea" }).mid).toBeGreaterThan(estimate(base).mid);
    expect(estimate({ ...base, tier: "signature" }).mid).toBeGreaterThan(estimate({ ...base, tier: "premium" }).mid);
  });

  it("تكرار الإضافات لا يضاعف التقدير", () => {
    const once = estimate({ ...base, addOns: ["hologram"] });
    const many = estimate({ ...base, addOns: ["hologram", "hologram", "hologram"] });
    expect(many).toEqual(once);
  });

  it("يقيّد المدخلات الشاذة (ضيوف < 10، أيام > 30)", () => {
    expect(estimate({ ...base, guests: 1 })).toEqual(estimate({ ...base, guests: 10 }));
    expect(estimate({ ...base, days: 999 })).toEqual(estimate({ ...base, days: 30 }));
  });

  it("إضافات الفئات الأعلى تُضرب في 1.2", () => {
    const essential = estimate({ ...base, addOns: ["creative"] }).mid - estimate(base).mid;
    const premium =
      estimate({ ...base, tier: "premium", addOns: ["creative"] }).mid - estimate({ ...base, tier: "premium" }).mid;
    expect(premium).toBeGreaterThan(essential);
  });
});
