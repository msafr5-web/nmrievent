import { NextResponse } from "next/server";
import { applicantReplySchema, fieldErrors } from "@/lib/applications";
import { parseServerEnv } from "@/lib/env";
import { applicantReply } from "@/server/admin/applications";
import { limiter } from "@/server/admin/limiters";
import { ipFromHeaders } from "@/server/admin/request";
import { getPool } from "@/server/db";

export const runtime = "nodejs";

const env = parseServerEnv();
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** رد المتقدم على طلب الاستكمال: يُقبل فقط للطلب بحالة "بانتظار استكمال" وبنفس التحقق (رقم الطلب + الجوال) */
export async function POST(req: Request) {
  if (limiter.status.isLimited(ipFromHeaders(req.headers) ?? "local")) return json({ error: "محاولات كثيرة، حاول بعد قليل." }, 429);
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 8 * 1024) return json({ error: "النص طويل جدًا." }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: "صيغة الطلب غير صالحة." }, 400);
  }
  const parsed = applicantReplySchema.safeParse(body);
  if (!parsed.success) return json({ error: "تحقق من البيانات.", fields: fieldErrors(parsed.error) }, 422);
  const pool = getPool(env.DATABASE_URL);
  if (!pool) return json({ error: "الخدمة غير متاحة حاليًا." }, 503);
  const ok = await applicantReply(pool, parsed.data.reference, parsed.data.phone, parsed.data.message);
  return ok ? json({ ok: true }, 200) : json({ error: "لا يمكن إرسال رد على هذا الطلب حاليًا." }, 409);
}
