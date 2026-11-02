import { readFileSync } from "node:fs";
import { join } from "node:path";
import jsQR from "jsqr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const pub = join(process.cwd(), "public");

describe("أصول التطبيق وQR", () => {
  it("رمز QR المطبوع يُقرأ فعلًا ويشير إلى رابط ملف التعريف", async () => {
    const { data, info } = await sharp(join(pub, "qr", "profile-qr.png")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    expect(decoded?.data).toMatch(/^https:\/\/[^/]+\/profile$/);
  });

  it("ملف التعريف PDF موجود وصالح", () => {
    const pdf = readFileSync(join(pub, "files", "nmr-events-profile.pdf"));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1_000_000);
  });

  it("أيقونات التطبيق بالأبعاد المطلوبة", async () => {
    for (const [file, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["icon-maskable-512.png", 512], ["apple-touch-icon.png", 180]] as const) {
      const m = await sharp(join(pub, "icons", file)).metadata();
      expect([m.width, m.height]).toEqual([size, size]);
    }
  });

  it("الـ Service Worker لا يخزّن API ولا PDF", () => {
    const sw = readFileSync(join(pub, "sw.js"), "utf8");
    expect(sw).toMatch(/\/api\//);
    expect(sw).toMatch(/\.pdf/);
  });
});
