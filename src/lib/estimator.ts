/**
 * حاسبة التكلفة المبدئية (FR-01).
 * تُستخدم في الواجهة للعرض الفوري، وتُعاد في الخادم عند استلام الطلب
 * حتى لا يُعتمد على رقم مرسل من المتصفح.
 * الأرقام تقديرية بالريال السعودي وتُضبط من فريق المبيعات.
 */

export const eventKinds = [
  { id: "conference", label: "مؤتمر", base: 60_000, perGuest: 420 },
  { id: "exhibition", label: "معرض / جناح", base: 85_000, perGuest: 180 },
  { id: "launch", label: "حفل تدشين", base: 70_000, perGuest: 650 },
  { id: "activation", label: "تفعيل تجاري", base: 45_000, perGuest: 120 },
  { id: "festival", label: "مهرجان / فعالية مفتوحة", base: 250_000, perGuest: 55 },
] as const;

export const tiers = [
  { id: "essential", label: "أساسي", note: "تنفيذ احترافي بمواصفات قياسية", factor: 1 },
  { id: "premium", label: "متميز", note: "إنتاج مخصص وتجارب تفاعلية", factor: 1.45 },
  { id: "signature", label: "فاخر", note: "تجربة استثنائية بلا حدود إبداعية", factor: 2.1 },
] as const;

export const addOns = [
  { id: "creative", label: "هوية بصرية وتصميم مسرح", flat: 35_000, perGuest: 0 },
  { id: "hologram", label: "هولوجرام / واقع معزز", flat: 60_000, perGuest: 0 },
  { id: "registration", label: "تسجيل ذكي وبطاقات NFC", flat: 18_000, perGuest: 22 },
  { id: "streaming", label: "بث مباشر / فعالية هجينة", flat: 40_000, perGuest: 0 },
  { id: "staffing", label: "مضيفون وكوادر ميدانية", flat: 0, perGuest: 45 },
  { id: "crowd", label: "إدارة حشود وسلامة", flat: 25_000, perGuest: 18 },
  { id: "transport", label: "نقل ومواقف ذكية", flat: 30_000, perGuest: 25 },
  { id: "hospitality", label: "ضيافة فاخرة", flat: 0, perGuest: 140 },
] as const;

export const cities = [
  { id: "riyadh", label: "الرياض", factor: 1 },
  { id: "jeddah", label: "جدة", factor: 1.03 },
  { id: "eastern", label: "المنطقة الشرقية", factor: 1.02 },
  { id: "alula", label: "العلا", factor: 1.25 },
  { id: "makkah-madinah", label: "مكة المكرمة / المدينة المنورة", factor: 1.08 },
  { id: "neom-redsea", label: "نيوم / البحر الأحمر", factor: 1.3 },
  { id: "other", label: "مدينة أخرى", factor: 1.1 },
] as const;

export type EventKindId = (typeof eventKinds)[number]["id"];
export type TierId = (typeof tiers)[number]["id"];
export type AddOnId = (typeof addOns)[number]["id"];
export type CityId = (typeof cities)[number]["id"];

export type EstimateInput = {
  kind: EventKindId;
  tier: TierId;
  guests: number;
  days: number;
  city: CityId;
  addOns: AddOnId[];
};

export type Estimate = { low: number; high: number; mid: number; perGuest: number };

const byId = <T extends { id: string }>(list: readonly T[], id: string) => list.find((x) => x.id === id);

export function estimate(input: EstimateInput): Estimate {
  const kind = byId(eventKinds, input.kind) ?? eventKinds[0];
  const tier = byId(tiers, input.tier) ?? tiers[0];
  const city = byId(cities, input.city) ?? cities[0];
  const guests = Math.max(10, Math.round(input.guests));
  const days = Math.min(30, Math.max(1, Math.round(input.days)));

  // الأيام الإضافية أقل كلفة من اليوم الأول (البنية مركبة مسبقًا)
  const dayFactor = 1 + (days - 1) * 0.45;

  let total = (kind.base + kind.perGuest * guests) * tier.factor * dayFactor;
  for (const id of input.addOns) {
    const a = byId(addOns, id);
    if (a) total += (a.flat + a.perGuest * guests * days) * (tier.factor > 1 ? 1.2 : 1);
  }
  total *= city.factor;

  const round = (n: number) => Math.round(n / 5_000) * 5_000;
  const mid = round(total);
  return { mid, low: round(total * 0.85), high: round(total * 1.18), perGuest: Math.round(total / guests) };
}

export const formatSAR = (n: number) =>
  new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 }).format(n) + " ر.س";

export const formatCompactSAR = (n: number) =>
  new Intl.NumberFormat("ar-SA-u-nu-latn", { notation: "compact", maximumFractionDigits: 1 }).format(n) + " ر.س";
