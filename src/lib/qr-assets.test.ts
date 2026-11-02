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

describe("أصول الهوية البصرية", () => {
  it("كل نسخ الشعار موجودة بأبعاد صحيحة وقناة شفافية", async () => {
    for (const f of ["nmr-logo", "nmr-logo-on-light", "nmr-logo-white", "nmr-logo-navy"]) {
      const m = await sharp(join(pub, "images", "brand", `${f}.png`)).metadata();
      expect([m.width, m.height], f).toEqual([722, 331]);
      expect(m.hasAlpha, f).toBe(true);
    }
    const mark = await sharp(join(pub, "images", "brand", "nmr-mark.png")).metadata();
    expect(mark.width).toBe(722);
    expect(mark.height).toBeLessThan(331); // بدون سطر EVENTS
  });

  it("النسخة الفاتحة بحروف كحلية والنسخة البيضاء بيضاء فعلًا", async () => {
    const px = async (f: string) => {
      const { data, info } = await sharp(join(pub, "images", "brand", f)).raw().toBuffer({ resolveWithObject: true });
      const out: number[][] = [];
      for (let i = 0; i < data.length; i += info.channels) if (data[i + 3] === 255) out.push([data[i], data[i + 1], data[i + 2]]);
      return out;
    };
    const onLight = await px("nmr-logo-on-light.png");
    expect(onLight.some(([r, g, b]) => r > 230 && g > 230 && b > 230)).toBe(false); // لا حروف بيضاء متبقية
    expect(onLight.some(([r, g, b]) => r > 230 && g > 70 && g < 110 && b < 60)).toBe(true); // البرتقالي محفوظ
    const white = await px("nmr-logo-white.png");
    expect(white.every(([r, g, b]) => r === 255 && g === 255 && b === 255)).toBe(true);
  });

  it("دليل الهوية PDF موجود", () => {
    const pdf = readFileSync(join(pub, "files", "nmr-brand-guidelines.pdf"));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
