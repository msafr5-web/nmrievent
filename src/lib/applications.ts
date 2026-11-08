import { z } from "zod";
import {
  availabilityOptions,
  boothTypes,
  exhibitionServices,
  exhibitorSectors,
  genders,
  languages,
  nationalities,
  regions,
  staffRoles,
} from "./applications-shared";

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((x) => x.id) as [T[number]["id"], ...T[number]["id"][]];

/** يوحّد الجوال السعودي إلى 05XXXXXXXX بعد إزالة المسافات والشرطات */
export function normalizeSaudiPhone(raw: string): string | null {
  const s = raw.trim().replace(/[\s\-()]/g, "");
  const m = /^(?:\+?966|0)?(5\d{8})$/.exec(s);
  return m ? `0${m[1]}` : null;
}

const phone = z
  .string()
  .trim()
  .transform((s, ctx) => {
    const n = normalizeSaudiPhone(s);
    if (!n) ctx.addIssue({ code: "custom", message: "رقم جوال سعودي غير صالح (مثال: 05XXXXXXXX)" });
    return n ?? "";
  });

const text = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max);
const email = z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(160);
const consent = z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" });
const thisYear = new Date().getFullYear();

/** حقل فخ للبوتات: أي قيمة تُقبل هنا عمدًا ويعالجها المسار بنجاح وهمي */
const trap = z.string().max(500).optional();

export const staffApplicationSchema = z.object({
  fullName: text(3, 120, "الاسم الكامل مطلوب"),
  phone,
  email,
  city: z.enum(ids(regions)),
  gender: z.enum(ids(genders)),
  nationality: z.enum(ids(nationalities)),
  birthYear: z.coerce.number().int().min(thisYear - 65, "سنة الميلاد غير صالحة").max(thisYear - 17, "العمر الأدنى 17 سنة"),
  roles: z.array(z.enum(ids(staffRoles))).min(1, "اختر دورًا واحدًا على الأقل").max(staffRoles.length).transform((a) => [...new Set(a)]),
  experienceYears: z.coerce.number().int().min(0).max(40),
  languages: z.array(z.enum(ids(languages))).min(1, "اختر لغة واحدة على الأقل").transform((a) => [...new Set(a)]),
  availability: z.enum(ids(availabilityOptions)),
  hasTransport: z.coerce.boolean().default(false),
  about: z.string().trim().max(1000).default(""),
  consent,
  company_site: trap,
});
export type StaffApplicationInput = z.infer<typeof staffApplicationSchema>;

export const exhibitionApplicationSchema = z.object({
  organization: text(2, 160, "اسم الجهة مطلوب"),
  contactName: text(3, 120, "اسم المسؤول مطلوب"),
  phone,
  email,
  city: z.enum(ids(regions)),
  crNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "السجل التجاري 10 أرقام")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  sector: z.enum(exhibitorSectors),
  exhibitionName: text(3, 160, "اسم المعرض مطلوب"),
  exhibitionDates: z.string().trim().max(80).default(""),
  boothSize: z.coerce.number().int().min(3, "الحد الأدنى 3 م²").max(5000),
  boothType: z.enum(ids(boothTypes)),
  services: z.array(z.enum(ids(exhibitionServices))).min(1, "اختر خدمة واحدة على الأقل").transform((a) => [...new Set(a)]),
  budget: z.enum(["lt-250k", "250k-1m", "1m-5m", "gt-5m", "undecided"]),
  details: z.string().trim().max(2000).default(""),
  consent,
  company_site: trap,
});
export type ExhibitionApplicationInput = z.infer<typeof exhibitionApplicationSchema>;

export const statusLookupSchema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^(STF|EXH)-\d{2}-[2-9A-HJ-NP-Z]{6}$/, "رقم الطلب غير صالح"),
  phone,
});

export const applicantReplySchema = statusLookupSchema.extend({ message: text(5, 1500, "اكتب ردًا لا يقل عن 5 أحرف") });

/** يحوّل أخطاء zod إلى {حقل: رسالة} (أول رسالة لكل حقل) */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}
