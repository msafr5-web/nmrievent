import { z } from "zod";
import { addOns, cities, eventKinds, tiers } from "./estimator";
import type { Budget, VenueStatus } from "./rfq-shared";

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((x) => x.id) as [T[number]["id"], ...T[number]["id"][]];

const DAY_MS = 24 * 60 * 60 * 1000;

/** تاريخ بصيغة YYYY-MM-DD صحيح وغير مضى عليه أكثر من يوم (هامش لفروق المناطق الزمنية) */
const futureDate = z
  .string()
  .min(1, "حدد التاريخ المتوقع")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صالحة")
  .refine((s) => {
    const t = Date.parse(`${s}T00:00:00Z`);
    return !Number.isNaN(t) && new Date(t).toISOString().startsWith(s);
  }, "تاريخ غير صالح")
  .refine((s) => Date.parse(`${s}T00:00:00Z`) >= Date.now() - DAY_MS, "التاريخ يجب أن يكون في المستقبل");

/** يزيل المسافات والشرطات قبل التحقق ليتطابق سلوك العميل والخادم */
const saudiPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+?966|0)?5\d{8}$/, "رقم جوال سعودي غير صالح (مثال: 05XXXXXXXX)"));

export const rfqSchema = z.object({
  kind: z.enum(ids(eventKinds)),
  tier: z.enum(ids(tiers)),
  guests: z.coerce.number().int().min(10, "الحد الأدنى 10 حضور").max(500_000),
  days: z.coerce.number().int().min(1).max(30),
  city: z.enum(ids(cities)),
  addOns: z
    .array(z.enum(ids(addOns)))
    .max(addOns.length)
    .transform((list) => [...new Set(list)]),
  date: futureDate,
  venueStatus: z.enum(["booked", "searching", "need-help"] satisfies [VenueStatus, ...VenueStatus[]]),
  budget: z.enum(["lt-250k", "250k-1m", "1m-5m", "gt-5m", "undecided"] satisfies [Budget, ...Budget[]]),
  goals: z.string().max(2000).optional().default(""),
  name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  organization: z.string().trim().min(2, "اسم الجهة مطلوب").max(160),
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  phone: saudiPhone,
  consent: z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" }),
  // حقل فخ للبوتات: يُقبل أي نص هنا عمدًا ويعالجه المسار بنجاح وهمي (لا نكشف للبوت أنه اكتُشف)
  company_site: z.string().max(500).optional(),
});

export type RfqInput = z.infer<typeof rfqSchema>;
