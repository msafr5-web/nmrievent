import { z } from "zod";
import { educationLevels, leadStages, projectStatuses } from "./types";

export const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+?966|0)?5\d{8}$/, "رقم جوال سعودي غير صالح (مثال: 05XXXXXXXX)"));

export const staffSchema = z.object({
  name: z.string().trim().min(5, "اكتب الاسم الثلاثي").max(120),
  phone,
  education: z.enum(educationLevels as [string, ...string[]], { errorMap: () => ({ message: "اختر المستوى التعليمي" }) }),
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح"),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().trim().regex(/^\d{4}$/, "الرمز مكون من 4 أرقام"),
});

const req = (msg: string) => z.string().trim().min(1, msg).max(200);

export const projectSchema = z.object({
  name: req("اسم الفعالية مطلوب"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "حدد التاريخ"),
  location: req("الموقع مطلوب"),
  area: req("المساحة مطلوبة"),
  services: req("الخدمات مطلوبة"),
  duration: req("المدة مطلوبة"),
  entity: req("الجهة مطلوبة"),
  supervisor: req("اسم المشرف مطلوب"),
  lat: z.coerce.number().min(16).max(33).default(24.7136),
  lng: z.coerce.number().min(34).max(56).default(46.6753),
  radiusM: z.coerce.number().int().min(50).max(5000).default(300),
  clientEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  reference: z.string().trim().max(40).optional(),
});

export const projectPatchSchema = z.object({
  status: z.enum(projectStatuses as [string, ...string[]]).optional(),
  advanceMilestone: z.boolean().optional(),
  zones: z.array(z.object({ name: z.string(), current: z.number().int().min(0) })).optional(),
  parkingOccupied: z.number().int().min(0).optional(),
});

export const assignSchema = z.object({
  staffId: z.string().min(1),
  role: z.string().trim().min(2, "حدد الدور").max(60),
  shiftStart: z.string().min(1, "حدد بداية الوردية"),
  shiftEnd: z.string().min(1, "حدد نهاية الوردية"),
});

export const leadStageSchema = z.object({ stage: z.enum(leadStages.map((s) => s.id) as [string, ...string[]]) });

export const loginSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("admin"), password: z.string().min(1, "كلمة المرور مطلوبة") }),
  z.object({ role: z.literal("ops"), password: z.string().min(1, "كلمة المرور مطلوبة") }),
  z.object({ role: z.literal("client"), reference: z.string().trim().min(3, "رقم الطلب مطلوب"), email: z.string().trim().toLowerCase().email("بريد غير صالح") }),
]);

export const checkinSchema = z.object({ token: z.string().min(10), lat: z.number(), lng: z.number(), action: z.enum(["in", "out"]).default("in") });
export const attendanceSchema = z.object({ projectId: z.string(), staffId: z.string(), action: z.enum(["in", "out"]) });
export const approveSchema = z.object({
  projectId: z.string(),
  approvalId: z.string(),
  signedBy: z.string().trim().min(3, "اكتب اسم المعتمد"),
  signature: z.string().startsWith("data:image/png;base64,", "التوقيع مطلوب").max(300_000),
});
