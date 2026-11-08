import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("يسمح حتى الحد ثم يمنع، ويتجدد بعد النافذة", () => {
    let t = 0;
    const l = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect([l.isLimited("a"), l.isLimited("a"), l.isLimited("a")]).toEqual([false, false, true]);
    expect(l.isLimited("b")).toBe(false);
    t = 1001;
    expect(l.isLimited("a")).toBe(false);
  });

  it("ينظّف المفاتيح المنتهية عند بلوغ maxKeys", () => {
    let t = 0;
    const l = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 3, now: () => t });
    ["a", "b", "c"].forEach((k) => l.isLimited(k));
    t = 2000;
    l.isLimited("d");
    expect(l.size()).toBe(1);
  });
});

describe("peek / hit (عدّ الإخفاقات فقط)", () => {
  it("peek لا يزيد العدّاد، وhit يزيده، ويُحظر بعد تجاوز الحد", () => {
    let t = 0;
    const l = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    for (let i = 0; i < 10; i++) expect(l.peek("ip")).toBe(false); // الفحص وحده لا يستهلك الحصة
    l.hit("ip");
    l.hit("ip");
    expect(l.peek("ip")).toBe(false); // عند الحد بالضبط لا يزال مسموحًا
    l.hit("ip");
    expect(l.peek("ip")).toBe(true);
    expect(l.peek("other")).toBe(false);
    t = 1001;
    expect(l.peek("ip")).toBe(false); // انتهت النافذة
    l.hit("ip");
    expect(l.peek("ip")).toBe(false);
  });
});
