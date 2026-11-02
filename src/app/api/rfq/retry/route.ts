import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getLeadRepository, getWebhook } from "@/server/rfq/container";
import { retryPending } from "@/server/rfq/submit-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request, secret: string) {
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** مهمة مجدولة (cron): إعادة تسليم المعلّق + حذف الطلبات المنتهية بعد مدة الاحتفاظ. الاستدعاء بـ Authorization: Bearer <CRON_SECRET> */
async function handle(req: Request) {
  const env = parseServerEnv();
  const repo = getLeadRepository(env);
  const webhook = getWebhook(env);

  // بدون سر مضبوط تُغلق النقطة تمامًا بدل أن تُترك مفتوحة
  if (!env.CRON_SECRET || !authorized(req, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!repo) {
    return NextResponse.json({ error: "DATABASE_URL is required" }, { status: 409 });
  }

  try {
    // إعادة التسليم تتطلب webhook؛ أما حذف المنتهي بحسب سياسة الاحتفاظ فيعمل دائمًا
    const retried = webhook ? await retryPending(repo, webhook) : { claimed: 0, delivered: 0, failed: 0 };
    const purged = await repo.purgeOlderThan(env.RFQ_RETENTION_DAYS);
    const result = { ...retried, purged };
    logger.info(result, "rfq cron run");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "rfq retry run failed");
    return NextResponse.json({ error: "Retry run failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
