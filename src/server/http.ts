import "server-only";
import { NextResponse } from "next/server";
import type { ZodError, ZodType, ZodTypeDef } from "zod";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400, fields?: Record<string, string>) =>
  NextResponse.json({ error, ...(fields ? { fields } : {}) }, { status });

export const unauthorized = () => fail("غير مصرح لك بهذا الإجراء.", 401);

export function fieldErrors(err: ZodError) {
  const fields: Record<string, string> = {};
  for (const i of err.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
  return fields;
}

export async function parse<T>(req: Request, schema: ZodType<T, ZodTypeDef, unknown>): Promise<{ data: T } | { res: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { res: fail("صيغة الطلب غير صالحة.") };
  }
  const r = schema.safeParse(body);
  return r.success ? { data: r.data } : { res: fail("يرجى مراجعة الحقول.", 422, fieldErrors(r.error)) };
}

/** حد بسيط للطلبات لكل مفتاح (يُستبدل بـ Redis في الإنتاج وفق SWET) */
const hits = new Map<string, { count: number; reset: number }>();
export function limited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const e = hits.get(key);
  if (!e || e.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  return ++e.count > limit;
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

/** إشعار خارجي (بريد / واتساب للأعمال / CRM) عبر Webhook — FR-04 */
export async function notify(event: string, payload: unknown) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) {
    console.info(`[notify] ${event}`);
    return false;
  }
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event, payload }) });
    return true;
  } catch (err) {
    console.error("[notify] failed", event, err);
    return false;
  }
}

/** نتيجة خطأ داخل عمليات التعديل — نوع مستقل يسهّل التمييز بـ isErr */
export type Err = { error: string; status: number };
export const err = (error: string, status: number): Err => ({ error, status });
export const isErr = (x: unknown): x is Err => typeof x === "object" && x !== null && "error" in x;
