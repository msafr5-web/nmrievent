import { z } from "zod";
import { addOns, cities, eventKinds, tiers } from "./estimator";
import type { Budget, VenueStatus } from "./rfq-shared";

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((x) => x.id) as [T[number]["id"], ...T[number]["id"][]];

export const rfqSchema = z.object({
  kind: z.enum(ids(eventKinds)),
  tier: z.enum(ids(tiers)),
  guests: z.coerce.number().int().min(10, "الحد الأدنى 10 حضور").max(500_000),
  days: z.coerce.number().int().min(1).max(30),
  city: z.enum(ids(cities)),
  addOns: z.array(z.enum(ids(addOns))).max(addOns.length),
  date: z.string().min(1, "حدد التاريخ المتوقع"),
  venueStatus: z.enum(["booked", "searching", "need-help"] satisfies [VenueStatus, ...VenueStatus[]]),
  budget: z.enum(["lt-250k", "250k-1m", "1m-5m", "gt-5m", "undecided"] satisfies [Budget, ...Budget[]]),
  goals: z.string().max(2000).optional().default(""),
  name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  organization: z.string().trim().min(2, "اسم الجهة مطلوب").max(160),
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?966|0)?5\d{8}$/, "رقم جوال سعودي غير صالح (مثال: 05XXXXXXXX)"),
  consent: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على سياسة الخصوصية" }) }),
  // حقل فخ للبوتات
  company_site: z.string().max(0).optional(),
});

export type RfqInput = z.infer<typeof rfqSchema>;
