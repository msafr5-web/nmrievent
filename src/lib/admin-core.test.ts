import { describe, expect, it } from "vitest";
import { exhibitionApplicationSchema, normalizeSaudiPhone, staffApplicationSchema, statusLookupSchema } from "./applications";
import { galleryCreateSchema, galleryUpdateSchema } from "./gallery-schema";
import { checkPassword, hashPassword, verifyPassword } from "./password";
import { ALL_PERMISSIONS, hasPermission, PRESETS, sanitizePermissions } from "./permissions";
import { hashToken, newToken, safeEqual } from "./tokens";

describe("permissions", () => {
  it("المدير الأعلى يملك كل شيء، وusers.manage له وحده", () => {
    const su = { isSuper: true, permissions: [] };
    for (const p of ALL_PERMISSIONS) expect(hasPermission(su, p)).toBe(true);
    expect(hasPermission(su, "users.manage")).toBe(true);
    const u = { isSuper: false, permissions: [...ALL_PERMISSIONS] };
    expect(hasPermission(u, "users.manage")).toBe(false);
    expect(hasPermission(null, "gallery.view")).toBe(false);
  });

  it("المستخدم العادي لا يملك إلا ما مُنح", () => {
    const u = { isSuper: false, permissions: ["staff.view"] };
    expect(hasPermission(u, "staff.view")).toBe(true);
    expect(hasPermission(u, "staff.review")).toBe(false);
    expect(hasPermission(u, "gallery.view")).toBe(false);
  });

  it("sanitize: يحذف المجهول والمكرر وusers.manage، ويضيف العرض الضمني", () => {
    const out = sanitizePermissions(["staff.review", "staff.review", "users.manage", "hack.all", "gallery.delete"]);
    expect(out).toEqual(["gallery.view", "gallery.delete", "staff.view", "staff.review"]);
    expect(sanitizePermissions([])).toEqual([]);
  });

  it("كل الإعدادات المسبقة تحتوي صلاحيات صالحة وبلا users.manage", () => {
    for (const p of PRESETS) {
      expect(sanitizePermissions(p.permissions)).toEqual(expect.arrayContaining(p.permissions));
      expect(p.permissions as string[]).not.toContain("users.manage");
    }
  });
});

describe("password & tokens", () => {
  it("scrypt: يتحقق من الصحيح ويرفض الخاطئ، وكل تجزئة بملح مختلف", async () => {
    const a = await hashPassword("Correct-Horse-Battery-9");
    const b = await hashPassword("Correct-Horse-Battery-9");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$65536$8$1$")).toBe(true);
    expect(await verifyPassword("Correct-Horse-Battery-9", a)).toBe(true);
    expect(await verifyPassword("correct-horse-battery-9", a)).toBe(false);
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  }, 20_000);

  it("سياسة كلمة السر", () => {
    expect(checkPassword("short1")).toBe("short");
    expect(checkPassword("onlyletterslongenough")).toBe("weak");
    expect(checkPassword("1234567890123")).toBe("weak");
    expect(checkPassword("aaaaaaaaaaaa1")).toBe("weak");
    expect(checkPassword("me@example.com1".padEnd(13, "x"), "me@example.com1xx")).toBeNull();
    expect(checkPassword("Admin-Panel-2026!")).toBeNull();
    expect(checkPassword("SAME-as-email-123", "same-as-email-123")).toBe("same-as-email");
  });

  it("الرموز: عشوائية، تجزئة ثابتة، ومقارنة آمنة", () => {
    expect(newToken()).not.toBe(newToken());
    expect(newToken().length).toBeGreaterThanOrEqual(43);
    expect(hashToken("a")).toBe(hashToken("a"));
    expect(hashToken("a")).not.toBe(hashToken("b"));
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

const staffBase = {
  fullName: "سارة العتيبي",
  phone: "05 1234 5678",
  email: "Sara@Example.com",
  city: "riyadh",
  gender: "female",
  nationality: "saudi",
  birthYear: 2000,
  roles: ["host", "host", "registration"],
  experienceYears: 3,
  languages: ["ar", "en"],
  availability: "events",
  consent: true,
};

describe("نموذج التوظيف", () => {
  it("يقبل طلبًا صحيحًا ويوحّد الجوال والبريد ويزيل التكرار", () => {
    const r = staffApplicationSchema.safeParse(staffBase);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBe("0512345678");
      expect(r.data.email).toBe("sara@example.com");
      expect(r.data.roles).toEqual(["host", "registration"]);
    }
  });

  it.each([
    ["جوال غير سعودي", { phone: "0412345678" }],
    ["بدون موافقة", { consent: false }],
    ["دور مجهول", { roles: ["hacker"] }],
    ["بدون أدوار", { roles: [] }],
    ["قاصر", { birthYear: new Date().getFullYear() - 10 }],
    ["مدينة مجهولة", { city: "mars" }],
    ["بريد خاطئ", { email: "nope" }],
  ])("يرفض: %s", (_n, over) => {
    expect(staffApplicationSchema.safeParse({ ...staffBase, ...over }).success).toBe(false);
  });
});

describe("نموذج المعارض", () => {
  const ex = {
    organization: "شركة الاختبار",
    contactName: "محمد",
    phone: "+966512345678",
    email: "m@example.com",
    city: "jeddah",
    sector: "تقنية واتصالات",
    exhibitionName: "معرض ليب",
    boothSize: 36,
    boothType: "custom",
    services: ["design", "build"],
    budget: "250k-1m",
    consent: true,
  };
  it("يقبل ويوحّد الجوال", () => {
    const r = exhibitionApplicationSchema.safeParse(ex);
    expect(r.success && r.data.phone).toBe("0512345678");
  });
  it.each([
    [{ boothSize: 1 }],
    [{ services: [] }],
    [{ sector: "قطاع وهمي" }],
    [{ crNumber: "123" }],
    [{ consent: false }],
  ])("يرفض %j", (over) => {
    expect(exhibitionApplicationSchema.safeParse({ ...ex, ...over }).success).toBe(false);
  });
  it("السجل التجاري الفارغ مقبول", () => {
    expect(exhibitionApplicationSchema.safeParse({ ...ex, crNumber: "" }).success).toBe(true);
  });
});

describe("مساعدات", () => {
  it("normalizeSaudiPhone", () => {
    expect(normalizeSaudiPhone("966512345678")).toBe("0512345678");
    expect(normalizeSaudiPhone("0512345678")).toBe("0512345678");
    expect(normalizeSaudiPhone("512345678")).toBe("0512345678");
    expect(normalizeSaudiPhone("12345")).toBeNull();
  });
  it("statusLookup يشترط صيغة المرجع", () => {
    expect(statusLookupSchema.safeParse({ reference: "stf-26-abc234", phone: "0512345678" }).success).toBe(true);
    expect(statusLookupSchema.safeParse({ reference: "NMR-26-ABC234", phone: "0512345678" }).success).toBe(false);
  });
});

describe("gallery schema", () => {
  it("checkbox: غياب الحقل = false، وon = true", () => {
    const r = galleryCreateSchema.parse({ category: "booths", alt: "جناح معرض بإضاءة", featured: "on" });
    expect(r.featured).toBe(true);
    expect(r.visible).toBe(false);
    expect(galleryCreateSchema.safeParse({ category: "nope", alt: "وصف طويل كفاية" }).success).toBe(false);
    expect(galleryCreateSchema.safeParse({ category: "booths", alt: "قصير" }).success).toBe(false);
    expect(galleryUpdateSchema.safeParse({ category: "booths", alt: "وصف طويل كفاية", sortOrder: "abc" }).success).toBe(false);
  });
  it("services تُنظَّف من التكرار وتُقيَّد بالخدمات الحقيقية", () => {
    const r = galleryCreateSchema.parse({ category: "booths", alt: "جناح معرض بإضاءة", services: ["tech", "tech"] });
    expect(r.services).toEqual(["tech"]);
    expect(galleryCreateSchema.safeParse({ category: "booths", alt: "جناح معرض بإضاءة", services: ["fake"] }).success).toBe(false);
  });
});
