import {
  availabilityOptions,
  boothTypes,
  exhibitionServices,
  genders,
  labelOf,
  languages,
  nationalities,
  regions,
  staffRoles,
  statusLabels,
  type ApplicationKind,
  type ApplicationStatus,
} from "./applications-shared";
import { budgetLabels, type Budget } from "./rfq-shared";

export type DisplayRow = { label: string; value: string };

const list = (ids: unknown, options: readonly { id: string; label: string }[]) =>
  Array.isArray(ids) ? ids.map((id) => labelOf(options, String(id))).join("، ") : "";

/** يحوّل بيانات الطلب المخزَّنة (payload) إلى صفوف مقروءة للمراجع، بتسميات عربية */
export function describePayload(kind: ApplicationKind, p: Record<string, unknown>, now = new Date()): DisplayRow[] {
  const rows: DisplayRow[] = [];
  const add = (label: string, value: unknown) => {
    const v = typeof value === "boolean" ? (value ? "نعم" : "لا") : value === undefined || value === null ? "" : String(value);
    if (v.trim()) rows.push({ label, value: v });
  };
  if (kind === "staff") {
    add("المدينة", labelOf(regions, String(p.city ?? "")));
    add("الجنس", labelOf(genders, String(p.gender ?? "")));
    add("الجنسية", labelOf(nationalities, String(p.nationality ?? "")));
    if (typeof p.birthYear === "number") add("العمر التقريبي", `${now.getFullYear() - p.birthYear} سنة (مواليد ${p.birthYear})`);
    add("الأدوار المطلوبة", list(p.roles, staffRoles));
    add("سنوات الخبرة", p.experienceYears);
    add("اللغات", list(p.languages, languages));
    add("التفرغ", labelOf(availabilityOptions, String(p.availability ?? "")));
    add("لديه وسيلة نقل", p.hasTransport);
    add("نبذة", p.about);
  } else {
    add("القطاع", p.sector);
    add("المدينة", labelOf(regions, String(p.city ?? "")));
    add("السجل التجاري", p.crNumber);
    add("المعرض", p.exhibitionName);
    add("تواريخ المعرض", p.exhibitionDates);
    add("مساحة الجناح", p.boothSize ? `${p.boothSize} م²` : "");
    add("نوع الجناح", labelOf(boothTypes, String(p.boothType ?? "")));
    add("الخدمات المطلوبة", list(p.services, exhibitionServices));
    add("الميزانية", budgetLabels[p.budget as Budget] ?? p.budget);
    add("تفاصيل إضافية", p.details);
  }
  return rows;
}

/** الجوال المحلي 05XXXXXXXX → صيغة واتساب الدولية 9665XXXXXXXX */
export const whatsappNumber = (localPhone: string) => `966${localPhone.replace(/^0/, "")}`;

/** نص رسالة واتساب جاهزة للمتقدم حسب حالة الطلب وآخر ملاحظة موجهة إليه */
export function whatsappMessage(opts: { name: string; reference: string; status: ApplicationStatus; note?: string; statusUrl: string }): string {
  const lines = [`مرحبًا ${opts.name}،`, `بخصوص طلبك رقم ${opts.reference} لدى NMR Events — الحالة: ${statusLabels[opts.status]}.`];
  if (opts.note?.trim()) lines.push("", opts.note.trim());
  if (opts.status === "needs_info") lines.push("", `يمكنك الرد من هنا: ${opts.statusUrl}`);
  else lines.push("", `لمتابعة طلبك: ${opts.statusUrl}`);
  return lines.join("\n");
}
