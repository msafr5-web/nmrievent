import { z } from "zod";
import { RETENTION_DEFAULTS } from "./applications-shared";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  /** PostgreSQL لحفظ الطلبات (Outbox) قبل التسليم */
  DATABASE_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  /** سر مهمة إعادة المحاولة المجدولة (Bearer) — 16 حرفًا على الأقل */
  CRON_SECRET: z.preprocess(blankToUndefined, z.string().min(16).optional()),
  /** مدة الاحتفاظ بالطلبات المنتهية بالأيام قبل حذفها (PDPL: الحد الأدنى من الاحتفاظ) */
  RFQ_RETENTION_DAYS: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(3_650).default(RETENTION_DEFAULTS.rfq)),
  /** البريد الوحيد للمدير الأعلى (يمنح الصلاحيات ويدير المستخدمين) */
  SUPER_ADMIN_EMAIL: z.preprocess(blankToUndefined, z.string().email().default("msafr.5@gmail.com")),
  /** رمز لمرة واحدة لإنشاء حساب المدير الأعلى (24 حرفًا على الأقل)؛ يتعطل الإعداد إن لم يُضبط */
  ADMIN_BOOTSTRAP_TOKEN: z.preprocess(blankToUndefined, z.string().min(24).optional()),
  /** مجلد حفظ الصور المرفوعة والسير الذاتية (يجب أن يكون على وحدة تخزين دائمة) */
  UPLOAD_DIR: z.preprocess(blankToUndefined, z.string().default("./data")),
  ADMIN_SESSION_HOURS: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(72).default(12)),
  /** مدة الاحتفاظ بطلبات التقديم المرفوضة بالأيام قبل حذفها تلقائيًا */
  APPLICATION_RETENTION_DAYS: z.preprocess(blankToUndefined, z.coerce.number().int().min(30).max(3_650).default(RETENTION_DEFAULTS.rejectedApplications)),
  RFQ_WEBHOOK_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  /** سر توقيع HMAC لطلبات الـ Webhook (16 حرفًا على الأقل) */
  RFQ_WEBHOOK_SECRET: z.preprocess(blankToUndefined, z.string().min(16).optional()),
  RFQ_WEBHOOK_TIMEOUT_MS: z.preprocess(blankToUndefined, z.coerce.number().int().min(500).max(30_000).default(5_000)),
  RFQ_RATE_LIMIT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(1_000).default(5)),
  /** Upstash Redis (اختياري) لمحدِّد معدل موزّع؛ يُضبطان معًا */
  UPSTASH_REDIS_REST_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(blankToUndefined, z.string().min(1).optional()),
  RFQ_RATE_WINDOW_MS: z.preprocess(blankToUndefined, z.coerce.number().int().min(1_000).default(10 * 60 * 1000)),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** يتحقق من المتغيرات ويفشل بوضوح (Fail-Fast) مع أسماء المتغيرات الخاطئة فقط دون قيمها */
export function parseServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Invalid environment configuration: ${names}`);
  }
  return result.data;
}
