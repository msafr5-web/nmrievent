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
