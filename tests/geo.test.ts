import { describe, expect, it } from "vitest";
import { distanceM } from "@/lib/geo";

describe("التحضير بالنطاق الجغرافي", () => {
  it("المسافة صفر لنفس النقطة", () => {
    expect(distanceM({ lat: 24.7546, lng: 46.6297 }, { lat: 24.7546, lng: 46.6297 })).toBe(0);
  });
  it("تحسب مسافة واقعية بين الرياض وجدة (~850 كم)", () => {
    const d = distanceM({ lat: 24.7136, lng: 46.6753 }, { lat: 21.4858, lng: 39.1925 });
    expect(d).toBeGreaterThan(840_000);
    expect(d).toBeLessThan(860_000);
  });
  it("تميز داخل وخارج نطاق 400 متر", () => {
    const venue = { lat: 24.7546, lng: 46.6297 };
    expect(distanceM(venue, { lat: 24.7566, lng: 46.6297 })).toBeLessThan(400);
    expect(distanceM(venue, { lat: 24.7606, lng: 46.6297 })).toBeGreaterThan(400);
  });
});
