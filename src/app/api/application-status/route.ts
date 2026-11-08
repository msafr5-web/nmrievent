import { NextResponse } from "next/server";
import { fieldErrors, statusLookupSchema } from "@/lib/applications";
import { parseServerEnv } from "@/lib/env";
import { limiter } from "@/server/admin/limiters";
import { publicStatus } from "@/server/admin/applications";
import { ipFromHeaders } from "@/server/admin/request";
import { getPool } from "@/server/db";

export const runtime = "nodejs";

const env = parseServerEnv();
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * متابعة حالة الطلب: رقم الطلب + الجوال المسجَّل. الرد واحد لأي عدم تطابق (404) حتى لا تُكشف أرقام الطلبات،
 * ومعدل الاستعلام محدود لكل عنوان. لا تُعاد الملاحظات الداخلية أبدًا.
 */
export async function POST(req: Request) {
  if (limiter.status.isLimited(ipFromHeaders(req.headers) ?? "local")) return json({ error: "محاولات كثيرة، حاول بعد قليل." }, 429);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "صيغة الطلب غير صالحة." }, 400);
  }
  const parsed = statusLookupSchema.safeParse(body);
  if (!parsed.success) return json({ error: "تحقق من رقم الطلب ورقم الجوال.", fields: fieldErrors(parsed.error) }, 422);
  const pool = getPool(env.DATABASE_URL);
  if (!pool) return json({ error: "الخدمة غير متاحة حاليًا." }, 503);
  const status = await publicStatus(pool, parsed.data.reference, parsed.data.phone);
  if (!status) return json({ error: "لم نجد طلبًا بهذه البيانات." }, 404);
  return json(status, 200);
}
