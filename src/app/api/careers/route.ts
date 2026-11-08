import { NextResponse } from "next/server";
import { fieldErrors, staffApplicationSchema } from "@/lib/applications";
import { CV_MAX_BYTES } from "@/lib/applications-shared";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { referenceNumber } from "@/lib/rfq-shared";
import { limiter } from "@/server/admin/limiters";
import { MediaError } from "@/server/admin/media";
import { submitStaffApplication } from "@/server/admin/intake";
import { ipFromHeaders } from "@/server/admin/request";
import { getPool } from "@/server/db";

export const runtime = "nodejs";

const env = parseServerEnv();
const MAX_BODY = CV_MAX_BYTES + 256 * 1024;
const UNAVAILABLE = "تعذر استلام طلبك حاليًا. يرجى المحاولة بعد قليل أو التواصل عبر واتساب.";
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** استقبال طلب توظيف/انضمام للكوادر (multipart مع سيرة ذاتية PDF اختيارية) */
export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers) ?? "local";
  if (limiter.apply.isLimited(ip)) return json({ error: "عدد كبير من الطلبات، حاول بعد قليل." }, 429);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return json({ error: "حجم الطلب كبير. الحد الأقصى للسيرة الذاتية 5 م.ب." }, 413);
  if (!req.headers.get("content-type")?.startsWith("multipart/form-data")) return json({ error: "صيغة الطلب غير صالحة." }, 415);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "صيغة الطلب غير صالحة." }, 400);
  }

  const raw = {
    fullName: form.get("fullName"),
    phone: form.get("phone"),
    email: form.get("email"),
    city: form.get("city"),
    gender: form.get("gender"),
    nationality: form.get("nationality"),
    birthYear: form.get("birthYear"),
    roles: form.getAll("roles"),
    experienceYears: form.get("experienceYears"),
    languages: form.getAll("languages"),
    availability: form.get("availability"),
    hasTransport: form.get("hasTransport") === "on" || form.get("hasTransport") === "true",
    about: form.get("about") ?? "",
    consent: form.get("consent") === "on" || form.get("consent") === "true",
    company_site: form.get("company_site") ?? undefined,
  };
  const parsed = staffApplicationSchema.safeParse(raw);
  if (!parsed.success) return json({ error: "يرجى مراجعة الحقول المطلوبة.", fields: fieldErrors(parsed.error) }, 422);

  // حقل الفخ: نجاح وهمي بلا معالجة
  if (parsed.data.company_site) return json({ reference: referenceNumber(new Date(), "STF") }, 201);

  const pool = getPool(env.DATABASE_URL);
  if (!pool) {
    logger.error("careers submission rejected: DATABASE_URL is not configured");
    return json({ error: UNAVAILABLE }, 503);
  }

  let cv: Buffer | null = null;
  const file = form.get("cv");
  if (file instanceof File && file.size > 0) {
    if (file.size > CV_MAX_BYTES) return json({ error: "حجم السيرة الذاتية يجب ألا يتجاوز 5 م.ب.", fields: { cv: "الحد الأقصى 5 م.ب" } }, 422);
    cv = Buffer.from(await file.arrayBuffer());
  }

  try {
    const reference = await submitStaffApplication(pool, env.UPLOAD_DIR, parsed.data, cv);
    logger.info({ reference }, "staff application received");
    return json({ reference }, 201);
  } catch (err) {
    if (err instanceof MediaError) return json({ error: err.message, fields: { cv: err.message } }, 422);
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "staff application failed");
    return json({ error: UNAVAILABLE }, 503);
  }
}
