import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, rgbTriplet, wcagLevel } from "@/lib/color";
import { gradients, palette, tokens, type Theme } from "./brand";

const themes: Theme[] = ["dark", "light"];

describe("color utils", () => {
  it("يحسب التباين وفق WCAG", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
    expect(wcagLevel(4.5)).toBe("AA");
    expect(wcagLevel(3.2)).toBe("AA Large");
    expect(wcagLevel(2)).toBe("Fail");
    expect(hexToRgb("#F05A22")).toEqual([240, 90, 34]);
    expect(() => hexToRgb("nope")).toThrow();
  });
});

describe.each(themes)("رموز الهوية — الوضع %s", (theme) => {
  const t = tokens[theme];
  const AA = 4.5;

  it.each([
    ["النص الأساسي على الخلفية", "fg", "bg"],
    ["النص الأساسي على البطاقة", "fg", "surface"],
    ["النص الأساسي على السطح المرتفع", "fg", "elevated"],
    ["النص الثانوي على الخلفية", "muted", "bg"],
    ["النص الثانوي على البطاقة", "muted", "surface"],
    ["النص الثانوي على السطح المرتفع", "muted", "elevated"],
    ["لون العلامة كنص على الخلفية", "brand", "bg"],
    ["لون العلامة كنص على البطاقة", "brand", "surface"],
    ["نص الزر الرئيسي على لون العلامة", "bg", "brand"],
    ["نص الزر الرئيسي عند التمرير", "bg", "brand-hover"],
    ["الخطأ على الخلفية", "danger", "bg"],
    ["الخطأ على البطاقة", "danger", "surface"],
    ["الرمل كنص على الخلفية", "sand", "bg"],
  ])("%s ≥ AA", (_label, fg, bg) => {
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(AA);
  });
});

describe("تطابق globals.css مع brand.ts", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const block = (sel: string) => {
    const m = new RegExp(`${sel}\\s*\\{([^}]*)\\}`).exec(css);
    if (!m) throw new Error(`block ${sel} not found`);
    return m[1];
  };

  it.each([["dark", ".dark"], ["light", ":root"]] as const)("متغيرات الوضع %s", (theme, selector) => {
    const body = block(selector);
    for (const [name, hex] of Object.entries(tokens[theme])) {
      const m = new RegExp(`--${name}:\\s*([\\d ]+);`).exec(body);
      expect(m, `--${name} in ${selector}`).not.toBeNull();
      expect(m![1].trim()).toBe(rgbTriplet(hex));
    }
  });
});

describe("لوحة الألوان", () => {
  it("كل عينة بنص مقروء (≥ AA) فوقها وبـ HEX صالح", () => {
    for (const s of Object.values(palette).flat()) {
      expect(contrastRatio(s.hex, s.on), `${s.name} (${s.hex}) vs ${s.on}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("ألوان التدرجات من اللوحة المعتمدة فقط", () => {
    const allowed = new Set([...Object.values(palette).flat().map((s) => s.hex.toUpperCase())]);
    for (const g of gradients) {
      for (const hex of g.css.match(/#[0-9A-Fa-f]{6}/g) ?? []) expect(allowed.has(hex.toUpperCase()), `${g.name}: ${hex}`).toBe(true);
    }
  });
});
