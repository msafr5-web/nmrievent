import { NextResponse } from "next/server";
import { exhibitionApplicationSchema, fieldErrors } from "@/lib/applications";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { referenceNumber } from "@/lib/rfq-shared";
import { limiter } from "@/server/admin/limiters";
import { submitExhibitionApplication } from "@/server/admin/intake";
import { ipFromHeaders } from "@/server/admin/request";
import { getPool } from "@/server/db";

export const runtime = "nodejs";

const env = parseServerEnv();
const MAX_BODY = 32 * 1024;
const UNAVAILABLE = "تعذر استلام طلبك حاليًا. يرجى المحاولة بعد قليل أو التواصل عبر واتساب.";
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** استقبال طلب مشاركة في معرض (JSON) */
export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers) ?? "local";
  if (limiter.apply.isLimited(ip)) return json({ error: "عدد كبير من الطلبات، حاول بعد قليل." }, 429);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return json({ error: "حجم الطلب كبير جدًا." }, 413);

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: "حجم الطلب كبير جدًا." }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: "صيغة الطلب غير صالحة." }, 400);
  }

  const parsed = exhibitionApplicationSchema.safeParse(body);
  if (!parsed.success) return json({ error: "يرجى مراجعة الحقول المطلوبة.", fields: fieldErrors(parsed.error) }, 422);
  if (parsed.data.company_site) return json({ reference: referenceNumber(new Date(), "EXH") }, 201);

  const pool = getPool(env.DATABASE_URL);
  if (!pool) {
    logger.error("exhibition submission rejected: DATABASE_URL is not configured");
    return json({ error: UNAVAILABLE }, 503);
  }
  try {
    const reference = await submitExhibitionApplication(pool, parsed.data);
    logger.info({ reference }, "exhibition application received");
    return json({ reference }, 201);
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "exhibition application failed");
    return json({ error: UNAVAILABLE }, 503);
  }
}
