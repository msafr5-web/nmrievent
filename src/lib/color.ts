/** أدوات ألوان نقية (بدون اعتماد على DOM) لحساب تباين WCAG وتحويل HEX/RGB. */

export type RGB = readonly [number, number, number];

export function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** صيغة المتغيرات في globals.css: "r g b" */
export const rgbTriplet = (hex: string) => hexToRgb(hex).join(" ");

export function relativeLuminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** نسبة التباين بين لونين (1–21) وفق WCAG 2.x */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(hexToRgb(a)), relativeLuminance(hexToRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}
